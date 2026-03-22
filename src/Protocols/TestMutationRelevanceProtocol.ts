import { MutantTestCoverage, StrykerOptions } from "@stryker-mutator/api/core"

export type CustomStrykerOptions = Pick<StrykerOptions, "testRunner" | "ignorePatterns"> & {
	testRunner: "vitest" | "jest"
	excludedVitestConfigs?: string[]
	isProbablyMonorepo?: boolean
}

export type ExecuteOptions = {
	repositoryRootPath: string
	targetResolvedFilePaths: string[]
	customStrykerOptions: CustomStrykerOptions
}

export type MutationTestStrengthResult = {
	rawTestCaseName: string
	killedMutantsCount: number
}

export type MutationTestStrength = {
	targetResolvedFilePath: string
	results: MutationTestStrengthResult[]
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

export type SetupStrykerOptions = {
	repositoryRootPath: string
	targetResolvedFilePaths: string[]
	customStrykerOptions: CustomStrykerOptions
}

export type TestMutationAnalysisResult = MutationTestStrength[]
