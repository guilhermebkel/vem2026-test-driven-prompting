import { ExploreContextOptions } from "@/Protocols/MethodContextExplorerProtocol"
import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"

import LogService from "@/Services/LogService"

import CodeBLEUUtil from "@/Utils/CodeBLEUUtil"
import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import PathUtil from "@/Utils/PathUtil"

class MethodContextExplorerService {
	async explore(options: ExploreContextOptions): Promise<void> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)

		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const resolvedMethodFilePaths = await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, options.methodFilePatterns, options.testFilePatterns)

		for (const exploredMethod of exploreMethodResult) {
			const exploredMethodCode = NodeJSCodeParserUtil.extractSpecificCodeFromSourceFile(exploredMethod.resolvedMethodFilePath, [{
				type: exploredMethod.declarationType as DeclarationType,
				name: exploredMethod.name
			}])

			const project = NodeJSCodeParserUtil.createProject()

			for (const resolvedMethodFilePath of resolvedMethodFilePaths) {
				const methodSourceFile = project.addSourceFileAtPath(resolvedMethodFilePath)
				const nodes = NodeJSCodeParserUtil.extractNodes(methodSourceFile, [{ type: "function" }, { type: "method" }])

				await Promise.all(
					nodes.map(async node => {
						const nodeCode = node.getText()

						const {
							dataflow_match_score,
							syntax_match_score,
							codebleu
						} = await CodeBLEUUtil.compute(exploredMethodCode, nodeCode)

						const isSimilarMethod = dataflow_match_score >= 0.6 && (syntax_match_score >= 0.55 || codebleu >= 0.5)

						if (isSimilarMethod) {
							console.log(`Similar file: ${resolvedMethodFilePath}\nOriginal file: ${exploredMethod.resolvedMethodFilePath}`)
							console.log(`Dataflow Match Score: ${dataflow_match_score}`)
							console.log(`Syntax Match Score: ${syntax_match_score}`)
							console.log(`CodeBLEU: ${codebleu}`)
							console.log("-----")
						}
					})
				)
			}
		}

		console.log(resolvedMethodFilePaths)
	}
}

export default new MethodContextExplorerService()
