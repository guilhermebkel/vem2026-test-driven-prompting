import { SemanticContextSlug } from "@/Protocols/ContextProtocol"
import { ExploreContextOptions, ExploreContextResult, ExploredContext, LoadedMethodFile } from "@/Protocols/MethodContextExplorerProtocol"
import { ExploredMethod, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"

import LogService from "@/Services/LogService"

import CodeBLEUUtil from "@/Utils/CodeBLEUUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"

class MethodContextExplorerService {
	async explore(options: ExploreContextOptions): Promise<ExploreContextResult> {
		const exploreMethodResult = await this.getExploredMethodResult(options)

		const resolvedMethodFilePaths = await this.searchResolvedMethodFilePaths(options)

		const loadedMethodFiles = await this.loadMethodFiles(resolvedMethodFilePaths)

		const exploredMethodContexts = await this.exploreMethodContexts(exploreMethodResult, loadedMethodFiles)

		return exploredMethodContexts
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

						const data = {
							resolvedFilePath: resolvedMethodFilePath,
							formattedNodes: nodes.map(node => ({
								name: node.getName() as string,
								code: node.getText()
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

	private async exploreMethodContexts(exploreMethodResult: ExploreMethodResult, loadedMethodFiles: LoadedMethodFile[]): Promise<ExploredContext[]> {
		return await TracingUtil.traceTask("Explore method file contexts...", async () => {
			const exploreContextResult: ExploreContextResult = []

			await DataProcessUtil.process({
				items: exploreMethodResult,
				batchSize: 5,
				handlerFn: async (exploredMethod, { current, total }) => {
					await TracingUtil.traceAction(`Processing ${current} of ${total} method files...`, async () => {
						const exploredContext: ExploredContext = {
							method: {
								name: exploredMethod.name as string,
								declarationType: exploredMethod.declarationType as DeclarationType,
								resolvedFilePath: exploredMethod.resolvedMethodFilePath
							},
							context: []
						}

						const similarMethodContext = await this.exploreSimilarMethodContext(exploredMethod, loadedMethodFiles)
						exploredContext.context.push(...similarMethodContext)

						exploreContextResult.push(exploredContext)
					})
				}
			})

			return exploreContextResult
		}) as ExploredContext[]
	}

	private async exploreSimilarMethodContext(exploredMethod: ExploredMethod, loadedMethodFiles: LoadedMethodFile[]): Promise<ExploredContext["context"]> {
		const similarMethodContext: ExploredContext["context"] = []

		const exploredMethodCode = NodeJSCodeParserUtil.extractSpecificCodeFromSourceFile(exploredMethod.resolvedMethodFilePath, [{
			type: exploredMethod.declarationType as DeclarationType,
			name: exploredMethod.name
		}])

		await DataProcessUtil.process({
			items: loadedMethodFiles || [],
			batchSize: 100,
			handlerFn: async (loadedMethodFile) => {
				const isSelfComparison = loadedMethodFile.resolvedFilePath === exploredMethod.resolvedMethodFilePath

				if (isSelfComparison) {
					return
				}

				await Promise.all(
					loadedMethodFile.formattedNodes.map(async formattedNode => {
						const result = await CodeBLEUUtil.compute({
							referenceCode: exploredMethodCode,
							hypothesisCode: formattedNode.code
						})

						const isSemanticallySimilarMethod = result.dataflowMatchScore >= 0.65 && result.syntaxMatchScore >= 0.30
						const isStructurallySimilarMethod = result.syntaxMatchScore >= 0.60 || result.weightedNgramScore >= 0.55

						let slug: SemanticContextSlug | null = null

						if (isSemanticallySimilarMethod) {
							slug = "semantically-similar-method"
						} else if (isStructurallySimilarMethod) {
							slug = "structurally-similar-method"
						}

						if (slug) {
							similarMethodContext.push({
								slug,
								resolvedFilePath: loadedMethodFile.resolvedFilePath,
								codeBLEUDetails: result
							})
						}
					})
				)
			}
		})

		return similarMethodContext
	}
}

export default new MethodContextExplorerService()
