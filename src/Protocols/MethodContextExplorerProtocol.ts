import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { ContextDefinitionItem } from "@/Protocols/ContextProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"
import { CodeBLEUFormattedResult } from "@/Protocols/CodeBLEUProtocol"

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
}

export type ExploredContext = {
	method: {
		name: string
		declarationType: DeclarationType
		resolvedFilePath: string
	}
	context: Array<Pick<ContextDefinitionItem, "type" | "slug"> & {
		resolvedFilePath: string
		codeBLEUDetails: CodeBLEUFormattedResult
	}>
}

export type ExploreContextResult = ExploredContext[]

export type LoadedMethodFile = {
	resolvedFilePath: string
	formattedNodes: Array<{
		name: string
		code: string
	}>
}