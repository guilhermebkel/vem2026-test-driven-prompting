import glob from "fast-glob"
import micromatch from "micromatch"


import { ExploredMethod, ExploreOptions, ExploreResult } from "@/Protocols/MethodExplorerProtocol"


import PathUtil from "@/Utils/PathUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import TracingUtil from "@/Utils/TracingUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"

import TestExecutorService from "@/Services/TestExecutorService"
import { CoverageReport } from "@/Protocols/TestExecutorProtocol"
import { NodeType, ProjectType } from "@/Protocols/NodeJSCodeParserProtocol"

class MethodExplorerService {
	async explore(options: ExploreOptions): Promise<ExploreResult> {
		const testCoverageReport = await this.getTestCoverageReport(options)

		const project = NodeJSCodeParserUtil.createProject()

		const testFilePaths = await this.searchTestFilePaths(options)
		await this.loadTestFiles(project, testFilePaths, options)

		const methodFilePaths = await this.searchMethodFilePaths(options)
		const exploredMethods = await this.exploreMethodFiles(project, methodFilePaths, testCoverageReport, options)

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

	private async loadTestFiles(project: ProjectType, testFilePaths: string[], options: ExploreOptions): Promise<void> {
		await TracingUtil.traceTask("Load test files...", async () => {
			await DataProcessUtil.process({
				items: testFilePaths,
				batchSize: 1,
				handlerFn: async (testFilePath, { current, total }) => {
					await TracingUtil.traceAction(`Loading ${current} of ${total} method files...`, async () => {
						const resolvedTestFilePath = PathUtil.resolveRelativeFilePath(options.repositoryName, testFilePath)
						project.addSourceFileAtPath(resolvedTestFilePath)
					})
				}
			})
		})
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

	private async exploreMethodFiles(project: ProjectType, methodFilePaths: string[], testCoverageReport: CoverageReport, options: ExploreOptions): Promise<ExploredMethod[]> {
		const exploredMethods: ExploredMethod[] = []

		await TracingUtil.traceTask("Process method files", async () => {
			await DataProcessUtil.process({
				items: methodFilePaths,
				batchSize: 20,
				handlerFn: async (methodFilePath, { current, total }) => {
					await TracingUtil.traceAction(`Processing ${current} of ${total} method files...`, async () => {
						const resolvedMethodFilePath = PathUtil.resolveRelativeFilePath(options.repositoryName, methodFilePath)
						const methodSourceFile = project.addSourceFileAtPath(resolvedMethodFilePath)

						const nodes = NodeJSCodeParserUtil.extractNodes(methodSourceFile, [
							{ type: "method" },
							{ type: "function" }
						])

						nodes.forEach(node => {
							const referencedFilePaths = node.findReferencesAsNodes().map(node => node.getSourceFile().getFilePath())
							const resolvedTestFilePath = referencedFilePaths.find(referencedFilePath => micromatch.isMatch(referencedFilePath, options.testFilePatterns))

							const exploredMethod: ExploredMethod = {
								name: node.getName(),
								declarationType: NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()),
								resolvedMethodFilePath,
								resolvedTestFilePath,
								testCoveragePercentage: this.getMethodTestCoveragePercentage(node, testCoverageReport)
							}

							exploredMethods.push(exploredMethod)
						})

						project.removeSourceFile(methodSourceFile)
					})
				}
			})
		})

		return exploredMethods
	}

	private getMethodTestCoveragePercentage(methodNode: NodeType, coverageReport: CoverageReport): number {
		const methodFilePath = methodNode.getSourceFile().getFilePath()
		const methodTestCoverageReport = coverageReport[methodFilePath]

		if (!methodTestCoverageReport) {
			return 0
		}

		const start = methodNode.getStartLineNumber()
		const end = methodNode.getEndLineNumber()

		let covered = 0
		let total = 0








		for (const [stmtId, loc] of Object.entries(methodTestCoverageReport.statementMap)) {
			const executed = methodTestCoverageReport.s[stmtId] ?? 0

			if (loc.start.line >= start && loc.end.line <= end) {
				total++
				if (executed > 0) covered++
			}
		}

		if (total === 0) {
			return 0
		}

		const testCoveragePercentage = (covered / total) * 100

		return Number(testCoveragePercentage.toFixed(2))

	}

	private async filterExploredMethods(exploredMethods: ExploredMethod[]): Promise<ExploredMethod[]> {
		const exploredMethodsWithTests = exploredMethods.filter(({ resolvedTestFilePath }) => Boolean(resolvedTestFilePath))

		const exploredMethodsWithTotalTestCoverage = exploredMethodsWithTests.filter(({ testCoveragePercentage }) => testCoveragePercentage >= 100)

		return exploredMethodsWithTotalTestCoverage
	}
}

export default new MethodExplorerService()