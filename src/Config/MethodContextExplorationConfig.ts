import { MethodContextExplorationOptions } from "@/Protocols/ExplorationProtocol"

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
