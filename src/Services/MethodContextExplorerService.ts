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
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)

		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const resolvedMethodFilePaths = await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, options.methodFilePatterns, options.testFilePatterns)

		const result: ExploreContextResult = []

		await TracingUtil.traceTask("Process method files", async () => {
			await DataProcessUtil.process({
				items: exploreMethodResult,
				batchSize: 20,
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

						const project = NodeJSCodeParserUtil.createProject()

						await DataProcessUtil.process({
							items: resolvedMethodFilePaths,
							batchSize: 20,
							handlerFn: async (resolvedMethodFilePath) => {
								const methodSourceFile = project.addSourceFileAtPath(resolvedMethodFilePath)
								const nodes = NodeJSCodeParserUtil.extractNodes(methodSourceFile, [{ type: "function" }, { type: "method" }])

								await Promise.all(
									nodes.map(async node => {
										const nodeCode = node.getText()

										const {
											dataflowMatchScore,
											syntaxMatchScore,
											codebleuScore
										} = await CodeBLEUUtil.compute(exploredMethodCode, nodeCode)

										const isSimilarMethod = dataflowMatchScore >= 0.6 && (syntaxMatchScore >= 0.55 || codebleuScore >= 0.5)
										const isSameMethod = node.getName() === exploredMethod.name

										if (isSimilarMethod && !isSameMethod) {
											exploredContext.context.push({
												slug: "similar-method",
												type: "semantic",
												path: resolvedMethodFilePath
											})
										}
									})
								)

								project.removeSourceFile(methodSourceFile)
							}
						})
					})
				}
			})
		})

		return result
	}
}

export default new MethodContextExplorerService()
