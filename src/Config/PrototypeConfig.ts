import { PrototypeOptions, TestCaseDistributionByMethod } from "@/Protocols/PrototypingProtocol"

export const methodWithRelevantTestsValidation = {
	hasMaxTestFileCount: (testCaseDistributionByMethod: TestCaseDistributionByMethod): boolean => (
		testCaseDistributionByMethod.testSuiteCount <= 1
	),
	hasMinTestCaseCount: (testCaseDistributionByMethod: TestCaseDistributionByMethod): boolean => (
		testCaseDistributionByMethod.testCaseCount > 5
	)
}

export const prototypeConfig: PrototypeOptions[] = [
	// {
	// 	repositoryName: "date-fns",
	// 	testRelevanceOptions: {
	// 		customStrykerOptions: {
	// 			testRunner: "vitest",
	// 			ignorePatterns: []
	// 		}
	// 	}
	// },
	{
		repositoryName: "directus",
		testRelevanceOptions: {
			customStrykerOptions: {
				testRunner: "vitest",
				ignorePatterns: [
					"tests/blackbox/**",
					"**/blackbox/**",
					"**/*.vue",
					"**/*.yaml",
					"**/app/**",
					"**/composables/**"
				]
			}
		}
	}
]
