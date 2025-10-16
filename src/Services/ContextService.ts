import { BuildedContext, ContextDefinitionItem, ContextSlug } from "@/Protocols/ContextProtocol"

import FileUtil from "@/Utils/FileUtil"

class ContextService {
	async buildContext(contextDefinition: ContextDefinitionItem[]): Promise<BuildedContext[]> {
		const contextSlugToContentHandlerFn: Record<ContextSlug, (contextItem: ContextDefinitionItem) => Promise<string>> = {
			"typing": async (contextItem) => await FileUtil.getFileContent(contextItem.path!),
			"project-metadata": async (contextItem) => await FileUtil.getFileContent(contextItem.path!),
			"repository-root-structure": async (contextItem) => (await FileUtil.getFolderPathList(contextItem.path!)).join("\n"),
			"similar-method": async (contextItem) => await FileUtil.getFileContent(contextItem.path!)
		}

		const buildedContext: BuildedContext[] = await Promise.all(
			contextDefinition.map(async (contextItem) => {
				const contentHandlerFn = contextSlugToContentHandlerFn[contextItem.slug]
				const content = await contentHandlerFn?.(contextItem)

				return {
					name: contextItem.slug,
					content
				}
			})
		)

		return Promise.resolve(buildedContext)
	}
}

export default new ContextService()
