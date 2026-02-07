import ContextUtil from "@/Utils/ContextUtil"
import TracingUtil from "@/Utils/TracingUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import FileUtil from "@/Utils/FileUtil"

import { ContextLoadOptions, ContextLoadResult } from "@/Protocols/ContextLoaderProtocol"

class ContextLoaderService {
	async loadContext(options: ContextLoadOptions): Promise<ContextLoadResult> {
		return await TracingUtil.traceAction("Retrieving context, test content and source file without method body...", async () => {
			const buildedContext = await ContextUtil.buildContext(options.context)

			const methodTestContent = await FileUtil.getFileContent(options.test.resolvedFilePath)

			const methodFileContentWithoutMethodBody = NodeJSCodeParserUtil.removeSpecificMethodOrFunctionBodyInSourceFile(options.method.resolvedFilePath, { type: options.method.declarationType, name: options.method.name })

			return {
				buildedContext,
				methodTestContent,
				methodFileContentWithoutMethodBody
			}
		})
	}
}

export default new ContextLoaderService()
