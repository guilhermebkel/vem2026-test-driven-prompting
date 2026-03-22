import { AnyOtherString } from "@/Protocols/TypeUtilityProtocol"
import { DeclarationType, ExtractionRule } from "@/Protocols/NodeJSCodeParserProtocol"

export type GlobalContextSlug = "project-metadata" | "repository-root-structure" | AnyOtherString
export type LocalContextSlug = "typing" | "same-class-method" | "same-file-function" | AnyOtherString
export type SemanticContextSlug = "imported-dependency" | "semantically-similar-method" | "structurally-similar-method" | "relevant-test-case" | AnyOtherString

export type ContextType = ContextDefinitionItem["type"]
export type ContextSlug = LocalContextSlug | SemanticContextSlug | GlobalContextSlug

export type DefaultContextDefinitionItemParams = {
	path?: string
	content?: string
	extractionRule?: ExtractionRule<DeclarationType>
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
