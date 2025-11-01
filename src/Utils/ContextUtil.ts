import { BuildedContext, ContextDefinition, ContextDefinitionItem, ContextSlug } from "@/Protocols/ContextProtocol"
import { OptionalRecord } from "@/Protocols/TypeUtilityProtocol"

import FileUtil from "@/Utils/FileUtil"

import DataNotFoundError from "@/Errors/DataNotFoundError"

class ContextUtil {
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
		let genericContent: string = ""

		if (contextItem.content) {
			genericContent = contextItem.content
		}

		if (contextItem.path) {
			genericContent = await FileUtil.getFileContent(contextItem.path)
		}

		if (!genericContent) {
			throw new DataNotFoundError(`No generic content was found for context item "${contextItem.slug}". Please provide a valid content or path.`)
		}

		return genericContent
	}

	private async handleFolderContent(contextItem: ContextDefinitionItem): Promise<string> {
		let folderContent = ""

		if (contextItem.path) {
			const folderPathList = await FileUtil.getFolderPathList(contextItem.path)

			folderContent = folderPathList.join("\n")
		}

		if (!folderContent) {
			throw new DataNotFoundError(`No folder content was found for context item "${contextItem.slug}". Please provide a valid folder path.`)
		}

		return folderContent
	}
}

export default new ContextUtil()
