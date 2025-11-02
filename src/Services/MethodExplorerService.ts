import glob from "fast-glob"
import Piscina from "piscina"
import { fileURLToPath } from "url"
import os from "os"

import { ExploredMethod, ExploreOptions, ExploreResult, MethodExplorerWorkerOptions, MethodExplorerWorkerResult } from "@/Protocols/MethodExplorerProtocol"
import { CoverageReport } from "@/Protocols/TestExecutorProtocol"

import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"

import TestExecutorService from "@/Services/TestExecutorService"

class MethodExplorerService {
	async explore(options: ExploreOptions): Promise<ExploreResult> {
		const testCoverageReport = await this.getTestCoverageReport(options)

		const testFilePaths = await this.searchTestFilePaths(options)
		const methodFilePaths = await this.searchMethodFilePaths(options)

		const exploredMethods = await this.exploreMethodFiles(testFilePaths, methodFilePaths, testCoverageReport, options)

		const filteredExploredMethods = await this.filterExploredMethods(exploredMethods)

		return filteredExploredMethods
	}

	private async getTestCoverageReport(options: ExploreOptions): Promise<CoverageReport> {
		return await TracingUtil.traceTask("Generate test coverage report...", async () => (
			await TestExecutorService.collectCoverageReportFromRepositoryTestSuite({
				repositoryName: options.repositoryName,
				repositoryTestSuiteWithCoverageReportCommand: options.repositoryTestSuiteWithCoverageReportCommand,
				coverageReportFilePattern: options.coverageReportFilePattern
			})
		)) as CoverageReport
	}

	private async searchTestFilePaths(options: ExploreOptions): Promise<string[]> {
		return await TracingUtil.traceTask("Search test file paths...", async (config) => {
			const testFilePaths = await glob(options.testFilePatterns, {
				cwd: PathUtil.getRepositoryRootPath(options.repositoryName),
				ignore: ["**/node_modules/**", "**/dist/**"]
			})

			config.setOutput(`Found ${testFilePaths.length} test file paths!`)

			return testFilePaths
		}) as string[]
	}

	private async searchMethodFilePaths(options: ExploreOptions): Promise<string[]> {
		return await TracingUtil.traceTask("Searching method file paths...", async (config) => {
			const methodFilePaths = await glob(options.methodFilePatterns, {
				cwd: PathUtil.getRepositoryRootPath(options.repositoryName),
				ignore: ["**/node_modules/**", "**/dist/**", ...options.testFilePatterns]
			})

			config.setOutput(`Found ${methodFilePaths.length} method file paths!`)

			return methodFilePaths
		}) as string[]
	}

	private async exploreMethodFiles(testFilePaths: string[], methodFilePaths: string[], testCoverageReport: CoverageReport, options: ExploreOptions): Promise<ExploredMethod[]> {
		return await TracingUtil.traceTask("Process method files", async (config) => {
			const methodExplorerWorkerPool = new Piscina<MethodExplorerWorkerOptions, MethodExplorerWorkerResult>({
				filename: fileURLToPath(import.meta.resolve("@/Workers/MethodExplorerWorker")),
				minThreads: 1,
				maxThreads: os.cpus().length,
				execArgv: ["--import", "tsx"]
			})

			const exploredMethods: ExploredMethod[] = []

			const chunks = DataProcessUtil.splitIntoChunks(methodFilePaths, methodExplorerWorkerPool.maxThreads)

			let processedMethodFilePathsCount = 0

			await Promise.all(
				chunks.map(async chunk => {
					const exploredMethodsByWorker = await methodExplorerWorkerPool.run({
						methodFilePaths: chunk,
						testFilePaths: testFilePaths,
						testFilePatterns: options.testFilePatterns,
						repositoryName: options.repositoryName,
						testCoverageReport: testCoverageReport
					})

					processedMethodFilePathsCount += chunk.length

					exploredMethods.push(...exploredMethodsByWorker)

					config.setOutput(`Processed ${processedMethodFilePathsCount} of ${methodFilePaths.length} method file paths...`)
				})
			)

			config.setOutput(`Found ${exploredMethods.length} methods!`)

			return exploredMethods
		}) as ExploredMethod[]
	}

	private async filterExploredMethods(exploredMethods: ExploredMethod[]): Promise<ExploredMethod[]> {
		const exploredMethodsWithTests = exploredMethods.filter(({ resolvedTestFilePath }) => Boolean(resolvedTestFilePath))

		const exploredMethodsWithTotalTestCoverage = exploredMethodsWithTests.filter(({ testCoveragePercentage }) => testCoveragePercentage >= 100)

		return exploredMethodsWithTotalTestCoverage
	}
}

export default new MethodExplorerService()
