import { AnyOtherString } from "@/Protocols/TypeUtilityProtocol"

export type GlobalContextSlug = "project-metadata" | "repository-root-structure" | AnyOtherString
export type LocalContextSlug = "typing" | AnyOtherString
export type SemanticContextSlug = "similar-method" | AnyOtherString

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
