import { CodeBLEUFormattedMetrics } from "@/Protocols/CodeBLEUMetricsProtocol"
import { CodeEmbeddingFormattedMetrics } from "@/Protocols/CodeEmbeddingMetricsProtocol"
import { MethodContextExplorationOptions } from "@/Protocols/ExplorationProtocol"
import { TestingMetrics } from "@/Protocols/MethodContextExplorerProtocol"
import { ExploredMethod } from "@/Protocols/MethodExplorerProtocol"
import { NodeType } from "@/Protocols/NodeJSCodeParserProtocol"

import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"

const DEFAULT_CONTEXT_TYPES: MethodContextExplorationOptions["exploreOptions"]["contextTypes"] = [
	"test-case"
]

export const methodContextExplorationValidation = {
	isSemanticallySimilarMethod: (codeBLEUMetrics: CodeBLEUFormattedMetrics, codeEmbeddingMetrics: CodeEmbeddingFormattedMetrics): boolean => (
		codeEmbeddingMetrics.embeddingSimilarity >= 0.78
		&& codeBLEUMetrics.dataflowMatchScore >= 0.40
	),
	isStructurallySimilarMethod: (codeBLEUMetrics: CodeBLEUFormattedMetrics): boolean => (
		codeBLEUMetrics.syntaxMatchScore >= 0.60
		|| codeBLEUMetrics.weightedNgramScore >= 0.55
	),
	isSameClassMethod: (exploredMethod: ExploredMethod, node: NodeType<"method" | "function">): boolean => (
		exploredMethod.name !== node.getName()
		&& NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()) === "method"
	),
	isSameFileFunction: (exploredMethod: ExploredMethod, node: NodeType<"method" | "function">): boolean => (
		exploredMethod.name !== node.getName()
		&& NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()) === "function"
	),
	isRelevantTestCase: (testingMetrics: TestingMetrics): boolean => (
		testingMetrics.totalTestSuiteCount <= 1
		&& testingMetrics.totalTestCaseCount > 5
		&& testingMetrics.killedMutantsCount > 0
	)
}

export const methodContextExplorationConfig: MethodContextExplorationOptions[] = [
	{
		exploreOptions: {
			repositoryName: "date-fns",
			methodFilePatterns: ["**/*.ts"],
			testFilePatterns: ["**/test.ts"],
			contextTypes: DEFAULT_CONTEXT_TYPES,
			contextCustomOptions: {
				customStrykerOptions: {
					testRunner: "vitest",
					ignorePatterns: []
				}
			}
		}
	},
	{
		exploreOptions: {
			repositoryName: "directus",
			methodFilePatterns: ["**/*.ts", "**/*.js"],
			testFilePatterns: ["**/*.spec.*", "**/*.test.*"],
			contextTypes: DEFAULT_CONTEXT_TYPES,
			contextCustomOptions: {
				customStrykerOptions: {
					testRunner: "vitest",
					ignorePatterns: [
						"tests/blackbox/**",
						"**/blackbox/**",
						"**/*.vue",
						"**/*.yaml",
						"api/src/services/payload.test.ts",
						"api/src/utils/stall.test.ts"
					],
					excludedVitestConfigs: [
						"tests/blackbox"
					],
					isProbablyMonorepo: true
				}
			}
		}
	}
]
