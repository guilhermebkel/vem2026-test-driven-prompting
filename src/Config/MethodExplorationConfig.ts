import { MethodExplorationOptions } from "@/Protocols/ExplorationProtocol"
import { MethodTestCoverageDetails } from "@/Protocols/TestCoverageProtocol"

export const methodExplorationValidation = {
	hasMinimumTestFileCount: (exploredMethodResolvedTestFilePaths: string[]): boolean => (
		exploredMethodResolvedTestFilePaths.length >= 1
	),
	hasMinimumTestCoveragePercentage: (exploredMethodTestCoverageDetails: MethodTestCoverageDetails): boolean => (
		exploredMethodTestCoverageDetails.lineCoveragePercentage >= 100
		&& exploredMethodTestCoverageDetails.statementCoveragePercentage >= 100
		&& exploredMethodTestCoverageDetails.branchCoveragePercentage >= 100
	)
}

export const methodExplorationConfig: MethodExplorationOptions[] = [
	{
		exploreOptions: {
			repositoryName: "fastify",
			methodFilePatterns: ["**/*.js"],
			testFilePatterns: ["**/*.test.js"],
			repositoryTestSuiteWithCoverageReportCommand: "pnpm dlx c8 --reporter=json node --test $(find test -name '*.test.js' ! -path 'test/bundler/*')",
			coverageReportFilePattern: "**/coverage/coverage-final.json"
		}
	},
	{
		exploreOptions: {
			repositoryName: "tabnews.com.br",
			methodFilePatterns: ["**/*.js"],
			testFilePatterns: ["**/*.test.js"],
			repositoryTestSuiteWithCoverageReportCommand: "npm run test -- --coverage --coverage.provider=v8 --coverage.reporter=json",
			coverageReportFilePattern: "**/coverage/coverage-final.json"
		}
	},
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
