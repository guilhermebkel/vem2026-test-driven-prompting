import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { ContextDefinitionItem } from "@/Protocols/ContextProtocol"
import { DeclarationType, ExtractionRule } from "@/Protocols/NodeJSCodeParserProtocol"
import { CodeBLEUFormattedMetrics } from "@/Protocols/CodeBLEUMetricsProtocol"
import { CodeEmbeddingFormattedMetrics } from "@/Protocols/CodeEmbeddingMetricsProtocol"
import { TestCaseRelevance } from "@/Protocols/PrototypingProtocol"
import { CustomStrykerOptions } from "@/Protocols/TestMutationRelevanceProtocol"

export type ExploreContextTypeToCustomOptions = {
	"same-location": void,
	"similar-method": void
	"test-case": {
		customStrykerOptions: CustomStrykerOptions
	}
}

export type ExploreContextType = keyof ExploreContextTypeToCustomOptions

export type ExploreContextCustomOptions<EContextType extends ExploreContextType> = ExploreContextTypeToCustomOptions[EContextType]

export type ExploreContextOptions<EContextType extends ExploreContextType = ExploreContextType> = {
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
			testing?: {
				totalTestSuiteCount: number
				totalTestCaseCount: number
				mutationScore: TestCaseRelevance["mutationScore"]
			}
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