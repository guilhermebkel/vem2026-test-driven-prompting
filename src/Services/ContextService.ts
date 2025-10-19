import { BuildedContext, ContextDefinition, ContextDefinitionItem, ContextSlug } from "@/Protocols/ContextProtocol"
import { OptionalRecord } from "@/Protocols/TypeUtilityProtocol"

import FileUtil from "@/Utils/FileUtil"

class ContextService {
	private readonly contextSlugToContentHandlerFn: OptionalRecord<ContextSlug, (contextItem: ContextDefinitionItem) => Promise<string>> = {
		"repository-root-structure": async (contextItem) => await this.handleFolderContent(contextItem)
	}

	async buildContext(contextDefinition: ContextDefinition): Promise<BuildedContext> {
		const buildedContext: BuildedContext = await Promise.all(
			contextDefinition.map(async (contextItem) => {
				const contentHandlerFn = this.contextSlugToContentHandlerFn[contextItem.slug] || this.handleGenericContent
				const content = await contentHandlerFn(contextItem)

				const formattedName = `${contextItem.slug}${contextItem.path ? ` (${contextItem.path})` : ""}`

				return {
					name: formattedName,
					content
				}
			})
		)

		return buildedContext
	}

	private async handleGenericContent(contextItem: ContextDefinitionItem): Promise<string> {
		if (contextItem.content) {
			return contextItem.content
		}

		if (contextItem.path) {
			return await FileUtil.getFileContent(contextItem.path)
		}

		return "N/A"
	}

	private async handleFolderContent(contextItem: ContextDefinitionItem): Promise<string> {
		if (contextItem.path) {
			const folderPathList = await FileUtil.getFolderPathList(contextItem.path!)

			const mergedFolderPathList = folderPathList.join("\n")

			return mergedFolderPathList
		}

		return "N/A"
	}
}

export default new ContextService()
