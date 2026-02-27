import { MutantTestCoverage } from "@stryker-mutator/api/core"

export type TestRunnerId = "vitest" | "jest"

export type ExecuteOptions = {
	repositoryRootPath: string
	targetResolvedFilePaths: string[]
	testRunnerId: TestRunnerId
}

export type MutationTestStrength = {
	targetResolvedFilePath: string
	results: Array<{
		rawTestCaseName: string
		killedMutantsCount: number
	}>
}

export type StrykerMutationReport = {
	files: Record<string, {
		mutants: MutantTestCoverage[]
	}>
	testFiles?: Record<string, {
		tests: Array<{
			id: string
			name: string
		}>
	}>
}

export type SetupStrykerConfigOptions = {
	repositoryRootPath: string
	targetResolvedFilePaths: string[]
	testRunnerId: TestRunnerId
}

export type MutationTestResult = MutationTestStrength[]
