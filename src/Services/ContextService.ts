import { BuildedContext, ContextDefinition, ContextDefinitionItem, ContextSlug } from "@/Protocols/ContextProtocol"

import FileUtil from "@/Utils/FileUtil"

class ContextService {
	async buildContext(contextDefinition: ContextDefinition): Promise<BuildedContext> {
		const contextSlugToContentHandlerFn: Record<ContextSlug | "default", (contextItem: ContextDefinitionItem) => Promise<string>> = {
			default: async (contextItem) => await this.handleGenericContent(contextItem),
			"typing": async (contextItem) => await this.handleGenericContent(contextItem),
			"project-metadata": async (contextItem) => await this.handleGenericContent(contextItem),
			"repository-root-structure": async (contextItem) => await this.handleFolderContent(contextItem),
			"similar-method": async (contextItem) => await this.handleGenericContent(contextItem),
			"dependent-method": async (contextItem) => await this.handleGenericContent(contextItem),
			"dependent-test": async (contextItem) => await this.handleGenericContent(contextItem)
		}

		const buildedContext: BuildedContext = await Promise.all(
			contextDefinition.map(async (contextItem) => {
				const contentHandlerFn = contextSlugToContentHandlerFn[contextItem.slug] || contextSlugToContentHandlerFn.default
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
