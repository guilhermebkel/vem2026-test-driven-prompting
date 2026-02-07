import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import TracingUtil from "@/Utils/TracingUtil"

import {
	SourceFileChangesReversionOptions,
	SourceFileWithOriginalMethodBodyOptions,
	SourceFileWithReconstructedMethodBodyOptions
} from "@/Protocols/RepositoryManagerProtocol"

class RepositoryManagerService {
	async revertSourceFileChanges(options: SourceFileChangesReversionOptions): Promise<void> {
		return await TracingUtil.traceAction("Reverting source file changes...", async () => {
			await FileUtil.setFileContent(options.methodResolvedFilePath, options.sourceFileWithOriginalMethodBody)
		})
	}

	async getSourceFileWithOriginalMethodBody(options: SourceFileWithOriginalMethodBodyOptions): Promise<string> {
		return await TracingUtil.traceAction("Retrieving source file with original method body...", async () => {
			const sourceFileWithOriginalMethodBody = await FileUtil.getFileContent(options.methodResolvedFilePath)

			return sourceFileWithOriginalMethodBody
		})
	}

	async getSourceFileWithReconstructedMethodBody(options: SourceFileWithReconstructedMethodBodyOptions): Promise<string> {
		return await TracingUtil.traceAction("Replacing source file with reconstructed method body...", async () => {
			const sourceFileWithReconstructedMethodBody = NodeJSCodeParserUtil.replaceSpecificMethodOrFunctionBodyInSourceFile(
				options.methodResolvedFilePath,
				{ type: options.methodDeclarationType, name: options.methodName },
				options.reconstructedMethodBody
			)

			await FileUtil.setFileContent(options.methodResolvedFilePath, sourceFileWithReconstructedMethodBody)

			return sourceFileWithReconstructedMethodBody
		})
	}
}

export default new RepositoryManagerService()
