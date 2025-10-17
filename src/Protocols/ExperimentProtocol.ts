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

export type RunExperimentOptions = {
	method: MethodDefinition
	reconstructionOptions: MethodReconstructionOptions
}

export type ExperimentResult = {
	reconstructedMethod: string
	sourceFileWithReconstructedMethod: string
	repositoryTestSuiteResult: RepositoryTestSuiteResult
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
