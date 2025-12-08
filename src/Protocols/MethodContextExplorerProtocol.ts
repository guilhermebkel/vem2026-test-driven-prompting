import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { ContextDefinition } from "@/Protocols/ContextProtocol"
import { DeclarationType } from "./NodeJSCodeParserProtocol"

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
	context: ContextDefinition
}

export type ExploreContextResult = ExploredContext[]