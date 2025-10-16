export type GlobalContextSlug = "project-metadata" | "repository-root-structure"
export type LocalContextSlug = "typing"
export type SemanticContextSlug = "similar-method"

export type ContextType = ContextDefinitionItem["type"]
export type ContextSlug = LocalContextSlug | SemanticContextSlug | GlobalContextSlug

export type ContextDefinitionItem =
	| { type: "local"; slug: LocalContextSlug; path?: string; content?: string }
	| { type: "semantic"; slug: SemanticContextSlug; path?: string; content?: string }
	| { type: "global"; slug: GlobalContextSlug; path?: string; content?: string }

export type ContextDefinition = ContextDefinitionItem[]

export type BuildedContextItem = {
	name: string
	content: string
}

export type BuildedContext = BuildedContextItem[]
