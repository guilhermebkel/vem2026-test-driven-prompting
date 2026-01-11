import { CodeBLEUFormattedResult } from "@/Protocols/CodeBLEUProtocol"
import { MethodContextExplorationOptions } from "@/Protocols/ExplorationProtocol"

export const methodContextExplorationValidation = {
	isSemanticallySimilarMethod: (codeBLEUResult: CodeBLEUFormattedResult): boolean => (
		codeBLEUResult.dataflowMatchScore >= 0.65 && codeBLEUResult.syntaxMatchScore >= 0.30
	),
	isStructurallySimilarMethod: (codeBLEUResult: CodeBLEUFormattedResult): boolean => (
		codeBLEUResult.syntaxMatchScore >= 0.60 || codeBLEUResult.weightedNgramScore >= 0.55
	),
	isSameClassMethod: (exploredMethodName?: string, sameClassMethodName?: string): boolean => (
		exploredMethodName !== sameClassMethodName
	)
}

export const methodContextExplorationConfig: MethodContextExplorationOptions[] = [
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
