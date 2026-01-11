import { SemanticContextSlug } from "@/Protocols/ContextProtocol"
import { ExploreContextOptions, ExploreContextResult, ExploredContext, LoadedMethodFile } from "@/Protocols/MethodContextExplorerProtocol"
import { ExploredMethod, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"

import { methodContextExplorationValidation } from "@/Config/MethodContextExplorationConfig"

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
								name: node.getName(),
								code: node.getText(),
								type: NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind())
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
							...await this.exploreSimilarMethodContext(exploredMethod, loadedMethodFiles),
							...await this.exploreSameClassMethodContext(exploredMethod)
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
						const result = await CodeBLEUUtil.compute({
							referenceCode: exploredMethodCode,
							hypothesisCode: formattedNode.code
						})

						let slug: SemanticContextSlug | null = null

						const isSemanticallySimilarMethod = methodContextExplorationValidation.isSemanticallySimilarMethod(result)
						const isStructurallySimilarMethod = methodContextExplorationValidation.isStructurallySimilarMethod(result)

						if (isSemanticallySimilarMethod) {
							slug = "semantically-similar-method"
						} else if (isStructurallySimilarMethod) {
							slug = "structurally-similar-method"
						}

						if (slug) {
							context.push({
								slug,
								resolvedFilePath: loadedMethodFile.resolvedFilePath,
								extractionRule: {
									type: formattedNode.type,
									name: formattedNode.name
								},
								codeBLEUDetails: result
							})
						}
					})
				)
			}
		})

		return context
	}

	private async exploreSameClassMethodContext(exploredMethod: ExploredMethod): Promise<ExploredContext["context"]> {
		const context: ExploredContext["context"] = []

		const project = NodeJSCodeParserUtil.createProject()

		const exploredMethodSourceFile = project.addSourceFileAtPath(exploredMethod.resolvedMethodFilePath)
		const nodes = NodeJSCodeParserUtil.extractNodes(exploredMethodSourceFile, [{ type: "method" }])

		nodes.forEach(node => {
			const isSameClassMethod = methodContextExplorationValidation.isSameClassMethod(exploredMethod.name, node.getName())

			if (isSameClassMethod) {
				context.push({
					slug: "same-class-method",
					resolvedFilePath: exploredMethod.resolvedMethodFilePath,
					extractionRule: {
						type: NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()),
						name: node.getName()
					}
				})
			}
		})

		project.removeSourceFile(exploredMethodSourceFile)

		return context
	}

	private async sortExploredMethodContexts(exploredMethodContexts: ExploredContext[]): Promise<ExploredContext[]> {
		return await TracingUtil.traceTask("Sort method contexts...", async (config) => {
			const sortedExploredMethodContexts = exploredMethodContexts
				.sort((a, b) => a.method.resolvedFilePath.localeCompare(b.method.resolvedFilePath))
				.map((exploredMethodContext) => {
					const sortedContext = exploredMethodContext.context.sort((a, b) => (
						a.resolvedFilePath.localeCompare(b.resolvedFilePath) || a.extractionRule.name!.localeCompare(b.extractionRule.name!)
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
