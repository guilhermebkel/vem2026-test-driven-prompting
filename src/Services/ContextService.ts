import { BuildedContext, ContextDefinition, ContextDefinitionItem, ContextSlug } from "@/Protocols/ContextProtocol"

import FileUtil from "@/Utils/FileUtil"

class ContextService {
	async buildContext(contextDefinition: ContextDefinition): Promise<BuildedContext> {
		const contextSlugToContentHandlerFn: Record<ContextSlug, (contextItem: ContextDefinitionItem) => Promise<string>> = {
			"typing": async (contextItem) => await this.handleContentDefault(contextItem),
			"project-metadata": async (contextItem) => await this.handleContentDefault(contextItem),
			"repository-root-structure": async (contextItem) => await this.handleContentFolder(contextItem),
			"similar-method": async (contextItem) => await this.handleContentDefault(contextItem)
		}

		const buildedContext: BuildedContext = await Promise.all(
			contextDefinition.map(async (contextItem) => {
				const contentHandlerFn = contextSlugToContentHandlerFn[contextItem.slug]
				const content = await contentHandlerFn?.(contextItem)

				return {
					name: contextItem.slug,
					content
				}
			})
		)

		return buildedContext
	}

	private async handleContentDefault(contextItem: ContextDefinitionItem): Promise<string> {
		if (contextItem.content) {
			return contextItem.content
		}

		if (contextItem.path) {
			return await FileUtil.getFileContent(contextItem.path)
		}

		return "N/A"
	}

	private async handleContentFolder(contextItem: ContextDefinitionItem): Promise<string> {
		const folderPathList = await FileUtil.getFolderPathList(contextItem.path!)

		return folderPathList.join("\n")
	}
}

export default new ContextService()
