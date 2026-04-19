import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import TracingUtil from "@/Utils/TracingUtil"

import {
	CheckSourceFileCompilationOptions,
	SetSourceFileWithReconstructedMethodBodyOptions,
	GetSourceFileWithOriginalMethodBodyOptions,
	RevertSourceFileChangesOptions
} from "@/Protocols/RepositoryManagerProtocol"

class RepositoryManagerService {
	async revertSourceFileChanges(options: RevertSourceFileChangesOptions): Promise<void> {
		return await TracingUtil.traceAction("Reverting source file changes...", async () => {
			await FileUtil.setFileContent(options.methodResolvedFilePath, options.sourceFileWithOriginalMethodBody)
		})
	}

	async getSourceFileWithOriginalMethodBody(options: GetSourceFileWithOriginalMethodBodyOptions): Promise<string> {
		return await TracingUtil.traceAction("Retrieving source file with original method body...", async () => {
			const sourceFileWithOriginalMethodBody = await FileUtil.getFileContent(options.methodResolvedFilePath)

			return sourceFileWithOriginalMethodBody
		})
	}

	async setSourceFileWithReconstructedMethodBody(options: SetSourceFileWithReconstructedMethodBodyOptions): Promise<string> {
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

	async checkSourceFileCompilation(options: CheckSourceFileCompilationOptions): Promise<boolean> {
		return await TracingUtil.traceAction("Checking if method can be compiled...", async () => {
			try {
				const project = NodeJSCodeParserUtil.createProject()

				const sourceFile = project.addSourceFileAtPath(options.methodResolvedFilePath)

				const syntacticDiagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile)

				project.removeSourceFile(sourceFile)

				return syntacticDiagnostics.length === 0
			} catch {
				return false
			}
		})
	}
}

export default new RepositoryManagerService()
