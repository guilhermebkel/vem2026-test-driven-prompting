import { CodeBLEUFormattedResult } from "@/Protocols/CodeBLEUProtocol"
import { MethodContextExplorationOptions } from "@/Protocols/ExplorationProtocol"
import { ExploredMethod } from "@/Protocols/MethodExplorerProtocol"
import { NodeType } from "@/Protocols/NodeJSCodeParserProtocol"

import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"

export const methodContextExplorationValidation = {
	isSemanticallySimilarMethod: (codeBLEUResult: CodeBLEUFormattedResult): boolean => (
		codeBLEUResult.dataflowMatchScore >= 0.65 && codeBLEUResult.syntaxMatchScore >= 0.30
	),
	isStructurallySimilarMethod: (codeBLEUResult: CodeBLEUFormattedResult): boolean => (
		codeBLEUResult.syntaxMatchScore >= 0.60 || codeBLEUResult.weightedNgramScore >= 0.55
	),
	isSameClassMethod: (exploredMethod: ExploredMethod, node: NodeType): boolean => (
		exploredMethod.name !== node.getName()
		&& NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()) === "method"
	),
	isSameFileFunction: (exploredMethod: ExploredMethod, node: NodeType): boolean => (
		exploredMethod.name !== node.getName()
		&& NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()) === "function"
	)
}

export const methodContextExplorationConfig: MethodContextExplorationOptions[] = [
	{
		exploreOptions: {
			repositoryName: "fastify",
			methodFilePatterns: ["**/*.js"],
			testFilePatterns: ["**/*.test.js"]
		}
	},
	{
		exploreOptions: {
			repositoryName: "tabnews.com.br",
			methodFilePatterns: ["**/*.js"],
			testFilePatterns: ["**/*.test.js"]
		}
	},
	{
		exploreOptions: {
			repositoryName: "date-fns",
			methodFilePatterns: ["**/*.ts"],
			testFilePatterns: ["**/test.ts"]
		}
	},
	{
		exploreOptions: {
			repositoryName: "directus",
			methodFilePatterns: ["**/*.ts", "**/*.js"],
			testFilePatterns: ["**/*.spec.*", "**/*.test.*"]
		}
	}
]
