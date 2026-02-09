import { AnyOtherString } from "@/Protocols/TypeUtilityProtocol"
import { ExtractionRule } from "@/Protocols/NodeJSCodeParserProtocol"

export type GlobalContextSlug = "project-metadata" | "repository-root-structure" | AnyOtherString
export type LocalContextSlug = "typing" | "same-class-method" | "same-file-function" | AnyOtherString
export type SemanticContextSlug = "similar-method" | "imported-dependency" | "dependent-method" | "dependent-test" | "semantically-similar-method" | "structurally-similar-method" | AnyOtherString

export type ContextType = ContextDefinitionItem["type"]
export type ContextSlug = LocalContextSlug | SemanticContextSlug | GlobalContextSlug

export type DefaultContextDefinitionItemParams = {
	path?: string
	content?: string
	extractionRule?: ExtractionRule
}

export type ContextDefinitionItem =
	| DefaultContextDefinitionItemParams & {
		type: "local"
		slug: LocalContextSlug
	}
	| DefaultContextDefinitionItemParams & {
		type: "semantic"
		slug: SemanticContextSlug
	}
	| DefaultContextDefinitionItemParams & {
		type: "global"
		slug: GlobalContextSlug
	}

export type ContextDefinition = ContextDefinitionItem[]

export type BuildedContextItem = {
	name: string
	content: string
}

export type BuildedContext = BuildedContextItem[]
