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

		const resolvedTestFilePaths = await this.searchResolvedTestFilePaths(options)
		await this.loadTestFiles(project, resolvedTestFilePaths)

		const resolvedMethodFilePaths = await this.searchResolvedMethodFilePaths(options)
		const exploredMethods = await this.exploreMethodFiles(project, resolvedMethodFilePaths, testCoverageReport, options)

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

	private async searchResolvedTestFilePaths(options: ExploreOptions): Promise<string[]> {
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

	private async searchResolvedMethodFilePaths(options: ExploreOptions): Promise<string[]> {
		return await TracingUtil.traceTask("Searching method file paths...", async (config) => {
			const resolvedMethodFilePaths = await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, options.methodFilePatterns, options.testFilePatterns)

			config.setOutput(`Found ${resolvedMethodFilePaths.length} method file paths!`)

			return resolvedMethodFilePaths
		}) as string[]
	}

	private async exploreMethodFiles(project: ProjectType, resolvedMethodFilePaths: string[], testCoverageReport: CoverageReport, options: ExploreOptions): Promise<ExploredMethod[]> {
		const exploredMethods: ExploredMethod[] = []

		await TracingUtil.traceTask("Process method files", async (config) => {
			await DataProcessUtil.process({
				items: resolvedMethodFilePaths,
				batchSize: 20,
				handlerFn: async (resolvedMethodFilePath, { current, total }) => {
					await TracingUtil.traceAction(`Processing ${current} of ${total} method files...`, async () => {
						const methodSourceFile = project.addSourceFileAtPath(resolvedMethodFilePath)

						const nodes = NodeJSCodeParserUtil.extractNodes(methodSourceFile, [
							{ type: "method" },
							{ type: "function" }
						])

						nodes.forEach(node => {
							const referencedFilePaths = node.findReferencesAsNodes().map(node => node.getSourceFile().getFilePath())
							const resolvedTestFilePath = referencedFilePaths.find(referencedFilePath => PathUtil.pathMatchesPatterns(referencedFilePath, options.testFilePatterns))

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

			config.setOutput(`Found ${exploredMethods.length} methods!`)
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