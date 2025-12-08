import { ExploreContextOptions, ExploreContextResult, ExploredContext } from "@/Protocols/MethodContextExplorerProtocol"
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
		const exploreMethodResult: ExploreMethodResult = await TracingUtil.traceTask("Load method exploration results...", async () => {
			const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
			const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)

			return JSON.parse(methodExplorationResultLogFileContent)
		})

		const resolvedMethodFilePaths = await TracingUtil.traceTask("Search method file paths...", async () => (
			await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, options.methodFilePatterns, options.testFilePatterns)
		))

		const methodFiles = await TracingUtil.traceTask("Preload method files...", async () => {
			const project = NodeJSCodeParserUtil.createProject()

			const methodFiles: Array<{ resolvedFilePath: string; formattedNodes: Array<{ name: string; code: string }> }> = []

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
		})

		const result = await TracingUtil.traceTask("Explore method file contexts...", async () => {
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
							items: methodFiles || [],
							batchSize: 100,
							handlerFn: async (methodFile) => {
								await Promise.all(
									methodFile.formattedNodes.map(async formattedNode => {
										const result = await CodeBLEUUtil.compute({
											slug: `${exploredMethod.resolvedMethodFilePath}::${methodFile.resolvedFilePath}`,
											referenceCode: exploredMethodCode,
											hypothesisCode: formattedNode.code
										})

										const isSimilarMethod = result.dataflowMatchScore >= 0.6 && (result.syntaxMatchScore >= 0.55 || result.codebleuScore >= 0.5)
										const isSameMethod = formattedNode.name === exploredMethod.name

										if (isSimilarMethod && !isSameMethod) {
											exploredContext.context.push({
												slug: "similar-method",
												type: "semantic",
												resolvedFilePath: methodFile.resolvedFilePath,
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
		})

		return result as ExploreContextResult
	}
}

export default new MethodContextExplorerService()
