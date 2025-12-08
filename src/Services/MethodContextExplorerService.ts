import { CodeBLEUFormattedResult } from "@/Protocols/CodeBLEUProtocol"
import { ExploreContextOptions, ExploreContextResult, ExploredContext, LoadedMethodFile } from "@/Protocols/MethodContextExplorerProtocol"
import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
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
						const exploredMethodCode = NodeJSCodeParserUtil.extractSpecificCodeFromSourceFile(exploredMethod.resolvedMethodFilePath, [{
							type: exploredMethod.declarationType as DeclarationType,
							name: exploredMethod.name
						}])

						const exploredContext: ExploredContext = {
							method: {
								name: exploredMethod.name as string,
								declarationType: exploredMethod.declarationType as DeclarationType,
								resolvedFilePath: exploredMethod.resolvedMethodFilePath
							},
							context: []
						}

						await DataProcessUtil.process({
							items: loadedMethodFiles || [],
							batchSize: 100,
							handlerFn: async (loadedMethodFile) => {
								const otherFormattedNodes = loadedMethodFile.formattedNodes.filter(formattedNode => (
									formattedNode.name !== exploredMethod.name
									&& loadedMethodFile.resolvedFilePath !== exploredMethod.resolvedMethodFilePath
								))

								await Promise.all(
									otherFormattedNodes.map(async formattedNode => {
										const result = await CodeBLEUUtil.compute({
											slug: `${exploredMethod.resolvedMethodFilePath}::${loadedMethodFile.resolvedFilePath}`,
											referenceCode: exploredMethodCode,
											hypothesisCode: formattedNode.code
										})


										if (this.isSimilarMethod(result)) {
											exploredContext.context.push({
												slug: "similar-method",
												type: "semantic",
												resolvedFilePath: loadedMethodFile.resolvedFilePath,
												codeBLEUDetails: result
											})
										}
									})
								)
							}
						})

						exploreContextResult.push(exploredContext)
					})
				}
			})

			return exploreContextResult
		}) as ExploredContext[]
	}

	private isSimilarMethod(codeBLEUResult: CodeBLEUFormattedResult): boolean {
		return (
			codeBLEUResult.dataflowMatchScore >= 0.6
			&& (codeBLEUResult.syntaxMatchScore >= 0.55 || codeBLEUResult.codebleuScore >= 0.5)
		)
	}
}

export default new MethodContextExplorerService()
