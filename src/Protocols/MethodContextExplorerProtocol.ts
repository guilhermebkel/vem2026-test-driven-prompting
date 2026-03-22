import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { ContextDefinitionItem } from "@/Protocols/ContextProtocol"
import { DeclarationType, ExtractionRule } from "@/Protocols/NodeJSCodeParserProtocol"
import { CodeBLEUFormattedMetrics } from "@/Protocols/CodeBLEUMetricsProtocol"
import { CodeEmbeddingFormattedMetrics } from "@/Protocols/CodeEmbeddingMetricsProtocol"
import { CustomStrykerOptions, MutationTestStrengthResult } from "@/Protocols/TestMutationRelevanceProtocol"

export type ExplorationContextTypeToCustomOptions = {
	"same-location": void
	"similar-method": void
	"relevant-test-case": {
		customStrykerOptions: CustomStrykerOptions
	}
}

export type ExplorationContextType = keyof ExplorationContextTypeToCustomOptions

export type ExploreContextCustomOptions<EContextType extends ExplorationContextType> = ExplorationContextTypeToCustomOptions[EContextType]

export type ExploreContextOptions<EContextType extends ExplorationContextType = ExplorationContextType> = {
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
	contextTypes: Array<EContextType>
	contextCustomOptions?: ExploreContextCustomOptions<EContextType>
}

export type TestingMetrics = Pick<MutationTestStrengthResult, "killedMutantsCount"> & {
	totalTestSuiteCount: number
	totalTestCaseCount: number
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
		metrics: {
			codeBLEU?: CodeBLEUFormattedMetrics
			codeEmbedding?: CodeEmbeddingFormattedMetrics
			testing?: TestingMetrics
		}
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