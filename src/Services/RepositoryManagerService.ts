import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"

import {
	SourceFileChangesReversionOptions,
	SourceFileWithOriginalMethodBodyOptions,
	SourceFileWithReconstructedMethodBodyOptions
} from "@/Protocols/RepositoryManagerProtocol"

class RepositoryManagerService {
	async revertSourceFileChanges(options: SourceFileChangesReversionOptions): Promise<void> {
		return await TracingUtil.traceAction("Reverting source file changes...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(options.repositoryName, options.methodRelativeFilePath)

			await FileUtil.setFileContent(methodFilePath, options.sourceFileWithOriginalMethodBody)
		})
	}

	async getSourceFileWithOriginalMethodBody(options: SourceFileWithOriginalMethodBodyOptions): Promise<string> {
		return await TracingUtil.traceAction("Retrieving source file with original method body...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(options.repositoryName, options.methodRelativeFilePath)

			const sourceFileWithOriginalMethodBody = await FileUtil.getFileContent(methodFilePath)

			return sourceFileWithOriginalMethodBody
		})
	}

	async getSourceFileWithReconstructedMethodBody(options: SourceFileWithReconstructedMethodBodyOptions): Promise<string> {
		return await TracingUtil.traceAction("Replacing source file with reconstructed method body...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(options.repositoryName, options.methodRelativeFilePath)

			const sourceFileWithReconstructedMethodBody = NodeJSCodeParserUtil.replaceSpecificMethodOrFunctionBodyInSourceFile(
				methodFilePath,
				{ type: options.methodDeclarationType, name: options.methodName },
				options.reconstructedMethodBody
			)

			await FileUtil.setFileContent(methodFilePath, sourceFileWithReconstructedMethodBody)

			return sourceFileWithReconstructedMethodBody
		})
	}
}

export default new RepositoryManagerService()
