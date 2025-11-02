import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"

import { MethodDefinition } from "@/Protocols/ExperimentationProtocol"

class RepositoryManagerService {
	async revertSourceFileChanges(methodDefinition: MethodDefinition, sourceFileWithOriginalMethodBody: string): Promise<void> {
		return await TracingUtil.traceAction("Reverting source file changes...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)
			await FileUtil.setFileContent(methodFilePath, sourceFileWithOriginalMethodBody)
		})
	}

	async getSourceFileWithOriginalMethodBody(methodDefinition: MethodDefinition): Promise<string> {
		return await TracingUtil.traceAction("Retrieving source file with original method body...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

			const sourceFileWithOriginalMethodBody = await FileUtil.getFileContent(methodFilePath)

			return sourceFileWithOriginalMethodBody
		})
	}

	async replaceSourceFileWithReconstructedMethodBody(methodDefinition: MethodDefinition, reconstructedMethodBody: string): Promise<string> {
		return await TracingUtil.traceAction("Replacing source file with reconstructed method body...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

			const sourceFileWithReconstructedMethodBody = NodeJSCodeParserUtil.replaceSpecificMethodOrFunctionBodyInSourceFile(
				methodFilePath,
				{ type: methodDefinition.declarationType, name: methodDefinition.name },
				reconstructedMethodBody
			)

			await FileUtil.setFileContent(methodFilePath, sourceFileWithReconstructedMethodBody)

			return sourceFileWithReconstructedMethodBody
		})
	}
}

export default new RepositoryManagerService()
