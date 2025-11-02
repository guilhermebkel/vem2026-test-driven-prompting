import { MethodExplorationOptions } from "@/Protocols/ExplorationProtocol"

export const methodExplorationConfig: MethodExplorationOptions[] = [
	{
		exploreOptions: {
			repositoryName: "date-fns",
			methodFilePatterns: ["**/*.ts"],
			testFilePatterns: ["**/test.ts"],
			repositoryTestSuiteWithCoverageReportCommand: "npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json",
			coverageReportFilePattern: "**/coverage/coverage-final.json"
		}
	},
	{
		exploreOptions: {
			repositoryName: "directus",
			methodFilePatterns: ["**/*.ts", "**/*.js"],
			testFilePatterns: ["**/*.spec.*", "**/*.test.*"],
			repositoryTestSuiteWithCoverageReportCommand: "pnpm -r --filter '!tests-blackbox' exec sh -c 'npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json || true'",
			coverageReportFilePattern: "**/coverage/coverage-final.json"
		}
	}
]
