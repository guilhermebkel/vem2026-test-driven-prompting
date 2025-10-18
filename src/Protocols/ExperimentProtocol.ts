import { LanguageModelName } from "@/Protocols/ModelProtocol"
import { ContextDefinition } from "@/Protocols/ContextProtocol"

export type RepositoryName = "date-fns"

export type MethodDefinition = {
	name: string
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
	testRelativeFilePath: string
	methodRelativeFilePath: string
}

export type ExperimentOptions = {
	method: MethodDefinition
	reconstructionOptions: MethodReconstructionOptions
}

export type ExperimentResult = {
	methodReconstructionResult: MethodReconstructionResult
	repositoryTestSuiteResult: RepositoryTestSuiteResult
	sourceFileWithReconstructedMethod: string
	sourceFileWithOriginalMethod: string
}

export type RepositoryTestSuiteResult = {
	success: boolean
	failureMessage?: string
}

export type MethodReconstructionOptions = {
	context: ContextDefinition
	model: {
		name: LanguageModelName
		reasoningBudget: number
		temperature: number
	}
}

export type MethodReconstructionResult = {
	reconstructedMethodBody: string
	systemPrompt: string
	userPrompt: string
}
