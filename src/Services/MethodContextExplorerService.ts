import { LocalContextSlug, SemanticContextSlug } from "@/Protocols/ContextProtocol"
import { ExploreContextOptions, ExploreContextResult, ExploredContext, LoadedMethodFile, TestingMetrics } from "@/Protocols/MethodContextExplorerProtocol"
import { ExploredMethod, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"
import { TestMutationAnalysisResult } from "@/Protocols/TestMutationRelevanceProtocol"

import { methodContextExplorationValidation } from "@/Config/MethodContextExplorationConfig"

import LogService from "@/Services/LogService"

import CodeBLEUMetricsUtil from "@/Utils/CodeBLEUMetricsUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"
import CodeEmbeddingMetricsUtil from "@/Utils/CodeEmbeddingMetricsUtil"
import InMemoryCacheUtil from "@/Utils/InMemoryCacheUtil"
import InMemoryMutexUtil from "@/Utils/InMemoryMutexUtil"
import TestMutationRelevanceUtil from "@/Utils/TestMutationRelevanceUtil"
import SanitizationUtil from "@/Utils/SanitizationUtil"

class MethodContextExplorerService {
	private testMutationAnalysisResultCache = new InMemoryCacheUtil<TestMutationAnalysisResult>({ defaultExpirationInSeconds: 3600 })
	private testMutationAnalysisResultMutex = new InMemoryMutexUtil()

	async explore(options: ExploreContextOptions): Promise<ExploreContextResult> {
		const exploreMethodResult = await this.getExploredMethodResult(options)

		const resolvedMethodFilePaths = await this.searchResolvedMethodFilePaths(options)

		const loadedMethodFiles = await this.loadMethodFiles(resolvedMethodFilePaths)

		const exploredMethodContexts = await this.exploreMethodContexts(exploreMethodResult, loadedMethodFiles, options)

		const sortedExploredMethodContexts = await this.sortExploredMethodContexts(exploredMethodContexts)

		return sortedExploredMethodContexts
	}

	private async getExploredMethodResult(options: ExploreContextOptions): Promise<ExploreMethodResult> {
		const exploreMethodResult: ExploreMethodResult = await TracingUtil.traceTask("Load method exploration results...", async () => {
			const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
			const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)

			return JSON.parse(methodExplorationResultLogFileContent)
		})

		return exploreMethodResult
	}

	private async searchResolvedMethodFilePaths(options: ExploreContextOptions): Promise<string[]> {
		return await TracingUtil.traceTask("Searching method file paths...", async (config) => {
			const resolvedMethodFilePaths = await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, options.methodFilePatterns, options.testFilePatterns)

			config.setOutput(`Found ${resolvedMethodFilePaths.length} method file paths!`)

			return resolvedMethodFilePaths
		}) as string[]
	}

	private async loadMethodFiles(resolvedMethodFilePaths: string[]): Promise<LoadedMethodFile[]> {
		return await TracingUtil.traceTask("Load method files...", async () => {
			const project = NodeJSCodeParserUtil.createProject()

			const methodFiles: LoadedMethodFile[] = []

			await DataProcessUtil.process({
				batchSize: 50,
				items: resolvedMethodFilePaths || [],
				handlerFn: async (resolvedMethodFilePath, { current, total }) => {
					await TracingUtil.traceAction(`Processing ${current} of ${total} method files...`, async () => {
						const methodSourceFile = project.addSourceFileAtPath(resolvedMethodFilePath)
						const nodes = NodeJSCodeParserUtil.extractNodes(methodSourceFile, [{ type: "function" }, { type: "method" }])

						const data: LoadedMethodFile = {
							resolvedFilePath: resolvedMethodFilePath,
							formattedNodes: nodes.map(node => ({
								name: node.getName() as string,
								code: node.getText(),
								type: NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()) as DeclarationType
							}))
						}

						project.removeSourceFile(methodSourceFile)

						methodFiles.push(data)
					})
				}
			})

			return methodFiles
		}) as LoadedMethodFile[]
	}

	private async exploreMethodContexts(exploreMethodResult: ExploreMethodResult, loadedMethodFiles: LoadedMethodFile[], exploreContextOptions: ExploreContextOptions): Promise<ExploredContext[]> {
		return await TracingUtil.traceTask("Explore method contexts...", async () => {
			const exploreContextResult: ExploreContextResult = []

			await DataProcessUtil.process({
				items: exploreMethodResult,
				batchSize: 5,
				handlerFn: async (exploredMethod, { current, total }) => {
					await TracingUtil.traceAction(`Processing ${current} of ${total} methods...`, async () => {
						const exploredContext: ExploredContext = {
							method: {
								name: exploredMethod.name as string,
								declarationType: exploredMethod.declarationType as DeclarationType,
								resolvedFilePath: exploredMethod.resolvedMethodFilePath
							},
							context: []
						}

						exploredContext.context = await Promise.all([
							...(exploreContextOptions.contextTypes.includes("similar-method") ? (
								await this.exploreSimilarMethodContext(exploredMethod, loadedMethodFiles)
							) : []),
							...(exploreContextOptions.contextTypes.includes("same-location") ? (
								await this.exploreSameLocationContext(exploredMethod)
							) : []),
							...(exploreContextOptions.contextTypes.includes("test-case") ? (
								await this.exploreTestCaseContext(exploredMethod, exploreMethodResult, exploreContextOptions)
							) : [])
						])

						exploreContextResult.push(exploredContext)
					})
				}
			})

			return exploreContextResult
		}) as ExploredContext[]
	}

	private async exploreSimilarMethodContext(exploredMethod: ExploredMethod, loadedMethodFiles: LoadedMethodFile[]): Promise<ExploredContext["context"]> {
		const context: ExploredContext["context"] = []

		const exploredMethodCode = NodeJSCodeParserUtil.extractSpecificCodeFromSourceFile(exploredMethod.resolvedMethodFilePath, [{
			type: exploredMethod.declarationType as DeclarationType,
			name: exploredMethod.name
		}])

		await DataProcessUtil.process({
			items: loadedMethodFiles || [],
			batchSize: 100,
			handlerFn: async (loadedMethodFile) => {
				const isSelfFileComparison = loadedMethodFile.resolvedFilePath === exploredMethod.resolvedMethodFilePath

				if (isSelfFileComparison) {
					return
				}

				await Promise.all(
					loadedMethodFile.formattedNodes.map(async formattedNode => {
						const [
							codeBLEUMetrics,
							codeEmbeddingMetrics
						] = await Promise.all([
							await CodeBLEUMetricsUtil.compute({ referenceCode: exploredMethodCode, hypothesisCode: formattedNode.code }),
							await CodeEmbeddingMetricsUtil.compute({ referenceCode: exploredMethodCode, hypothesisCode: formattedNode.code })
						])

						let slug: SemanticContextSlug | null = null

						const isSemanticallySimilarMethod = methodContextExplorationValidation.isSemanticallySimilarMethod(codeBLEUMetrics, codeEmbeddingMetrics)
						const isStructurallySimilarMethod = methodContextExplorationValidation.isStructurallySimilarMethod(codeBLEUMetrics)

						if (isSemanticallySimilarMethod) {
							slug = "semantically-similar-method"
						} else if (isStructurallySimilarMethod) {
							slug = "structurally-similar-method"
						}

						if (slug) {
							context.push({
								slug,
								type: "semantic",
								resolvedFilePath: loadedMethodFile.resolvedFilePath,
								extractionRule: {
									name: formattedNode.name,
									type: formattedNode.type
								},
								metrics: {
									codeBLEU: codeBLEUMetrics,
									codeEmbedding: codeEmbeddingMetrics
								}
							})
						}
					})
				)
			}
		})

		return context
	}

	private async exploreSameLocationContext(exploredMethod: ExploredMethod): Promise<ExploredContext["context"]> {
		const context: ExploredContext["context"] = []

		const project = NodeJSCodeParserUtil.createProject()

		const exploredMethodSourceFile = project.addSourceFileAtPath(exploredMethod.resolvedMethodFilePath)
		const nodes = NodeJSCodeParserUtil.extractNodes(exploredMethodSourceFile, [{ type: "function" }, { type: "method" }])

		nodes.forEach(node => {
			let slug: LocalContextSlug | null = null

			const isSameClassMethod = methodContextExplorationValidation.isSameClassMethod(exploredMethod, node)
			const isSameFileFunction = methodContextExplorationValidation.isSameFileFunction(exploredMethod, node)

			if (isSameClassMethod) {
				slug = "same-class-method"
			} else if (isSameFileFunction) {
				slug = "same-file-function"
			}

			if (slug) {
				context.push({
					slug,
					type: "local",
					resolvedFilePath: exploredMethod.resolvedMethodFilePath,
					extractionRule: {
						name: node.getName() as string,
						type: NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()) as DeclarationType
					},
					metrics: {}
				})
			}
		})

		project.removeSourceFile(exploredMethodSourceFile)

		return context
	}

	private async exploreTestCaseContext(exploredMethod: ExploredMethod, exploreMethodResult: ExploreMethodResult, exploreContextOptions: ExploreContextOptions): Promise<ExploredContext["context"]> {
		const context: ExploredContext["context"] = []

		const totalTestSuiteCount = exploredMethod.resolvedTestFilePaths.length
		let totalTestCaseCount = 0

		const project = NodeJSCodeParserUtil.createProject()

		exploredMethod.resolvedTestFilePaths.forEach(testFilePath => {
			const sourceFile = project.addSourceFileAtPath(testFilePath)

			const testCases = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-case" }])

			totalTestCaseCount += testCases.length

			project.removeSourceFile(sourceFile)
		})

		const resolvedMethodFilePaths = exploreMethodResult.map(exploreMethodResult => exploreMethodResult.resolvedMethodFilePath)

		const allMethodTestMutationResults = await this.testMutationAnalysisResultMutex.execute(exploreContextOptions.repositoryName, async () => (
			await this.testMutationAnalysisResultCache.cachefy(exploreContextOptions.repositoryName, async () => (
				await TestMutationRelevanceUtil.execute({
					repositoryRootPath: PathUtil.getRepositoryRootPath(exploreContextOptions.repositoryName),
					targetResolvedFilePaths: resolvedMethodFilePaths,
					customStrykerOptions: exploreContextOptions.contextCustomOptions!.customStrykerOptions
				})
			))
		))

		const currentTestMutationResult = allMethodTestMutationResults.find(mutationTestStrength => (
			exploredMethod.resolvedMethodFilePath === mutationTestStrength.targetResolvedFilePath
		))

		exploredMethod.resolvedTestFilePaths.forEach(resolvedTestFilePath => {
			const sourceFile = project.addSourceFileAtPath(resolvedTestFilePath)

			const testCases = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-case" }])

			testCases.forEach(testCase => {
				const testCaseName = SanitizationUtil.extractTestCaseName(testCase)

				const testMutationResultForTestCase = currentTestMutationResult?.results.find(result => (
					result.rawTestCaseName.endsWith(testCaseName)
					&& result.rawTestCaseName.startsWith(exploredMethod.name)
				))

				const testingMetrics: TestingMetrics = {
					totalTestSuiteCount,
					totalTestCaseCount,
					killedMutantsCount: testMutationResultForTestCase?.killedMutantsCount ?? 0
				}

				const isRelevantTestCase = methodContextExplorationValidation.isRelevantTestCase(testingMetrics)

				if (isRelevantTestCase) {
					context.push({
						slug: "relevant-test-case",
						type: "semantic",
						resolvedFilePath: resolvedTestFilePath,
						extractionRule: {
							type: "test-case",
							name: testCaseName
						},
						metrics: {
							testing: testingMetrics
						}
					})
				}
			})

			project.removeSourceFile(sourceFile)
		})

		return context
	}

	private async sortExploredMethodContexts(exploredMethodContexts: ExploredContext[]): Promise<ExploredContext[]> {
		return await TracingUtil.traceTask("Sort method contexts...", async (config) => {
			const sortedExploredMethodContexts = exploredMethodContexts
				.sort((a, b) => a.method.resolvedFilePath.localeCompare(b.method.resolvedFilePath))
				.map((exploredMethodContext) => {
					const sortedContext = exploredMethodContext.context.sort((a, b) => (
						a.resolvedFilePath.localeCompare(b.resolvedFilePath) || a.extractionRule.name.localeCompare(b.extractionRule.name!)
					))

					return {
						...exploredMethodContext,
						context: sortedContext
					}
				})

			config.setOutput(`Sorted ${sortedExploredMethodContexts.length} method contexts!`)

			return sortedExploredMethodContexts
		}) as ExploredContext[]
	}
}

export default new MethodContextExplorerService()
