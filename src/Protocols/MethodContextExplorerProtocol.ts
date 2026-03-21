import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { ContextDefinitionItem } from "@/Protocols/ContextProtocol"
import { DeclarationType, ExtractionRule } from "@/Protocols/NodeJSCodeParserProtocol"
import { CodeBLEUFormattedMetrics } from "@/Protocols/CodeBLEUMetricsProtocol"
import { CodeEmbeddingFormattedMetrics } from "./CodeEmbeddingMetricsProtocol"

export type ExploreContextOptions = {
	repositoryName: RepositoryName
	/**
	 * Examples:
	 * - \/**\/*.js
	 * - \/**\/*.ts
	 */
	methodFilePatterns: string[]
	/**
	 * Examples:
	 * - \/**\/*.spec.\*
	 * - \/**\/*.test.\*
	 */
	testFilePatterns: string[]
	contextTypes: Array<"same-location" | "similar-method" | "test-case">
}

export type ExploredContext = {
	method: {
		name: string
		declarationType: DeclarationType
		resolvedFilePath: string
	}
	context: Array<Pick<ContextDefinitionItem, "slug" | "type"> & {
		resolvedFilePath: string
		extractionRule: Required<ExtractionRule<DeclarationType>>
		codeBLEUMetrics?: CodeBLEUFormattedMetrics
		codeEmbeddingMetrics?: CodeEmbeddingFormattedMetrics
	}>
}

export type ExploreContextResult = ExploredContext[]

export type LoadedMethodFile = {
	resolvedFilePath: string
	formattedNodes: Array<{
		name: string
		code: string
		type: DeclarationType
	}>
}