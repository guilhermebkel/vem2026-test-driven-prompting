import { MutantTestCoverage, StrykerOptions } from "@stryker-mutator/api/core"

export type CustomStrykerOptions = Pick<StrykerOptions, "testRunner" | "ignorePatterns"> & {
	testRunner: "vitest" | "jest"
	excludedVitestConfigs?: string[]
}

export type ExecuteOptions = {
	repositoryRootPath: string
	targetResolvedFilePaths: string[]
	customStrykerOptions: CustomStrykerOptions
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
	customStrykerOptions: CustomStrykerOptions
}

export type TestMutationAnalysisResult = MutationTestStrength[]
