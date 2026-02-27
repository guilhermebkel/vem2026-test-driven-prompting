import { ExploredMethod, ExploreMethodOptions, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import { CoverageReport } from "@/Protocols/TestExecutorProtocol"
import { DeclarationType, ProjectType } from "@/Protocols/NodeJSCodeParserProtocol"

import { methodExplorationValidation } from "@/Config/MethodExplorationConfig"

import PathUtil from "@/Utils/PathUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import TracingUtil from "@/Utils/TracingUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import ArrayUtil from "@/Utils/ArrayUtil"
import TestCoverageUtil from "@/Utils/TestCoverageUtil"

import TestExecutorService from "@/Services/TestExecutorService"

class MethodExplorerService {
	async explore(options: ExploreMethodOptions): Promise<ExploreMethodResult> {
		const testCoverageReport = await this.getTestCoverageReport(options)

		const project = NodeJSCodeParserUtil.createProject()

		const resolvedTestFilePaths = await this.searchResolvedTestFilePaths(options)
		await this.loadTestFiles(project, resolvedTestFilePaths)

		const resolvedMethodFilePaths = await this.searchResolvedMethodFilePaths(options)
		const exploredMethods = await this.exploreMethodFiles(project, resolvedMethodFilePaths, testCoverageReport, options)

		const filteredExploredMethods = await this.filterExploredMethods(exploredMethods)

		const sortedExploredMethods = await this.sortExploredMethods(filteredExploredMethods)

		return sortedExploredMethods
	}

	private async getTestCoverageReport(options: ExploreMethodOptions): Promise<CoverageReport> {
		return await TracingUtil.traceTask("Generate test coverage report...", async () => (
			await TestExecutorService.collectCoverageReportFromRepositoryTestSuite({
				repositoryName: options.repositoryName,
				repositoryTestSuiteWithCoverageReportCommand: options.repositoryTestSuiteWithCoverageReportCommand,
				coverageReportFilePattern: options.coverageReportFilePattern
			})
		)) as CoverageReport
	}

	private async searchResolvedTestFilePaths(options: ExploreMethodOptions): Promise<string[]> {
		return await TracingUtil.traceTask("Search test file paths...", async (config) => {
			const resolvedTestFilePaths = await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, options.testFilePatterns)

			config.setOutput(`Found ${resolvedTestFilePaths.length} test file paths!`)

			return resolvedTestFilePaths
		}) as string[]
	}

	private async loadTestFiles(project: ProjectType, resolvedTestFilePaths: string[]): Promise<void> {
		await TracingUtil.traceTask("Load test files...", async () => {
			await DataProcessUtil.process({
				items: resolvedTestFilePaths,
				batchSize: 1,
				handlerFn: async (resolvedTestFilePath, { current, total }) => {
					await TracingUtil.traceAction(`Loading ${current} of ${total} method files...`, async () => {
						project.addSourceFileAtPath(resolvedTestFilePath)
					})
				}
			})
		})
	}

	private async searchResolvedMethodFilePaths(options: ExploreMethodOptions): Promise<string[]> {
		return await TracingUtil.traceTask("Searching method file paths...", async (config) => {
			const resolvedMethodFilePaths = await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, options.methodFilePatterns, options.testFilePatterns)

			config.setOutput(`Found ${resolvedMethodFilePaths.length} method file paths!`)

			return resolvedMethodFilePaths
		}) as string[]
	}

	private async exploreMethodFiles(project: ProjectType, resolvedMethodFilePaths: string[], testCoverageReport: CoverageReport, options: ExploreMethodOptions): Promise<ExploredMethod[]> {
		const exploredMethods: ExploredMethod[] = []

		await TracingUtil.traceTask("Process method files...", async (config) => {
			await DataProcessUtil.process({
				items: resolvedMethodFilePaths,
				batchSize: 20,
				handlerFn: async (resolvedMethodFilePath, { current, total }) => {
					await TracingUtil.traceAction(`Processing ${current} of ${total} method files...`, async () => {
						const methodSourceFile = project.addSourceFileAtPath(resolvedMethodFilePath)

						const nodes = NodeJSCodeParserUtil.extractNodes(methodSourceFile, [{ type: "method" }, { type: "function" }])

						nodes.forEach(node => {
							const referencedFilePaths = node.findReferencesAsNodes().map(node => node.getSourceFile().getFilePath())
							const resolvedTestFilePathsIncludingDuplicates = referencedFilePaths.filter(referencedFilePath => PathUtil.pathMatchesPatterns(referencedFilePath, options.testFilePatterns))

							const exploredMethod: ExploredMethod = {
								name: node.getName() as string,
								declarationType: NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()) as DeclarationType,
								resolvedMethodFilePath,
								resolvedTestFilePaths: ArrayUtil.keepUniqueValues(resolvedTestFilePathsIncludingDuplicates),
								testCoverageDetails: TestCoverageUtil.getMethodTestCoverageDetails(node, testCoverageReport)
							}

							exploredMethods.push(exploredMethod)
						})

						project.removeSourceFile(methodSourceFile)
					})
				}
			})

			config.setOutput(`Found ${exploredMethods.length} methods!`)
		})

		return exploredMethods
	}

	private async filterExploredMethods(exploredMethods: ExploredMethod[]): Promise<ExploredMethod[]> {
		return await TracingUtil.traceTask("Filter method files...", async (config) => {
			const exploredMethodsWithMinimumTestFileCount = exploredMethods.filter(({ resolvedTestFilePaths }) => (
				methodExplorationValidation.hasMinimumTestFileCount(resolvedTestFilePaths)
			))

			const exploredMethodsWithMinimumTestCoveragePercentage = exploredMethodsWithMinimumTestFileCount.filter(({ testCoverageDetails }) => (
				methodExplorationValidation.hasMinimumTestCoveragePercentage(testCoverageDetails)
			))

			config.setOutput(`Selected ${exploredMethodsWithMinimumTestCoveragePercentage.length} methods!`)

			return exploredMethodsWithMinimumTestCoveragePercentage
		}) as ExploredMethod[]
	}

	private async sortExploredMethods(exploredMethods: ExploredMethod[]): Promise<ExploredMethod[]> {
		return await TracingUtil.traceTask("Sort method files...", async (config) => {
			const sortedExploredMethods = exploredMethods
				.sort((a, b) => a.resolvedMethodFilePath.localeCompare(b.resolvedMethodFilePath))
				.map((exploredMethod) => {
					const sortedResolvedTestFilePaths = exploredMethod.resolvedTestFilePaths.sort((a, b) => a.localeCompare(b))

					return {
						...exploredMethod,
						resolvedTestFilePaths: sortedResolvedTestFilePaths
					}
				})

			config.setOutput(`Sorted ${sortedExploredMethods.length} methods!`)

			return sortedExploredMethods
		}) as ExploredMethod[]
	}
}

export default new MethodExplorerService()