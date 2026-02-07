import ContextUtil from "@/Utils/ContextUtil"
import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import FileUtil from "@/Utils/FileUtil"

import { ContextDefinition, ContextDefinitionItem } from "@/Protocols/ContextProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { ContextLoadOptions, ContextLoadResult } from "@/Protocols/ContextLoaderProtocol"

class ContextLoaderService {
	async loadContext(options: ContextLoadOptions): Promise<ContextLoadResult> {
		return await TracingUtil.traceAction("Retrieving context, test content and source file without method body...", async () => {
			const contextDefinitionWithResolvedRelativePath = this.resolveContextRelativeFilePath(options.context, options.repositoryName)
			const buildedContext = await ContextUtil.buildContext(contextDefinitionWithResolvedRelativePath)

			const methodTestContent = await FileUtil.getFileContent(options.test.resolvedFilePath)

			const methodFileContentWithoutMethodBody = NodeJSCodeParserUtil.removeSpecificMethodOrFunctionBodyInSourceFile(options.method.resolvedFilePath, { type: options.method.declarationType, name: options.method.name })

			return {
				buildedContext,
				methodTestContent,
				methodFileContentWithoutMethodBody
			}
		})
	}

	private resolveContextRelativeFilePath(contextDefinition: ContextDefinition, repositoryName: RepositoryName): ContextDefinition {
		return contextDefinition.map((item) => {
			return {
				...item,
				...(item.path && { path: PathUtil.resolveRelativeFilePath(repositoryName, item.path) })
			} as ContextDefinitionItem
		})
	}
}

export default new ContextLoaderService()
