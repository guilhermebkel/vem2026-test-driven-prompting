
import { getFileContent } from "@/get-file-content"
import { getFolderPathList } from "./get-folder-path-list"

export type GlobalContextSlug = "project-metadata" | "repository-root-structure"
export type LocalContextSlug = "typing"
export type SemanticContextSlug = "similar-method"

export type ContextType = ContextDefinitionItem["type"]
export type ContextSlug = LocalContextSlug | SemanticContextSlug | GlobalContextSlug

export type ContextDefinitionItem =
	| { type: "local"; slug: LocalContextSlug; path?: string; content?: string }
	| { type: "semantic"; slug: SemanticContextSlug; path?: string; content?: string }
	| { type: "global"; slug: GlobalContextSlug; path?: string; content?: string }

export type BuildedContext = {
	name: string
	content: string
}

export const buildContext = async (contextDefinition: ContextDefinitionItem[]): Promise<BuildedContext[]> => {
	const contextSlugToContextContentHandlerFn: Record<ContextSlug, (contextItem: ContextDefinitionItem) => Promise<string>> = {
		"typing": async (contextItem) => await getFileContent(contextItem.path!),
		"project-metadata": async (contextItem) => await getFileContent(contextItem.path!),
		"repository-root-structure": async (contextItem) => (await getFolderPathList(contextItem.path!)).join("\n"),
		"similar-method": async (contextItem) => await getFileContent(contextItem.path!)
	}

	const buildedContext: BuildedContext[] = await Promise.all(
		contextDefinition.map(async (contextItem) => {
			const contextContextHandlerFn = contextSlugToContextContentHandlerFn[contextItem.slug]
			const content = await contextContextHandlerFn?.(contextItem)

			return {
				name: contextItem.slug,
				content
			}
		})
	)

	return Promise.resolve(buildedContext)
}
