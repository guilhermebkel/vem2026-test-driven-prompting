export type MutationExecutionOptions = {
	repositoryRootPath: string
	targetFileResolvedPaths: string[]
	testRunner: "vitest" | "jest"
}

export type MutationTestStrength = {
	targetFileRelativePath: string
	results: Array<{
		testName: string
		killedMutantsCount: number
	}>
}

export type MutationReport = {
	files: Record<string, {
		mutants: Array<{
			status: string
			killedBy: string
		}>
	}>
}

export type SetupStrykerConfigOptions = {
	repositoryRootPath: string
	targetFileResolvedPaths: string[]
	testRunner: string
}