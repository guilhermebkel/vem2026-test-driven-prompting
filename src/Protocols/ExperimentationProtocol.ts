import { LanguageModelName } from "@/Protocols/ModelProtocol"
import { ContextDefinition } from "@/Protocols/ContextProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { RepositoryTestSuiteResult } from "@/Protocols/TestExecutorProtocol"

export type MethodDefinition = {
	name: string
	declarationType: DeclarationType
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
	testRelativeFilePath: string
	methodRelativeFilePath: string
}

export type ExperimentOptions = {
	title: string
	method: MethodDefinition
	reconstructionOptions: MethodReconstructionOptions
}

export type ExperimentResult = {
	methodReconstructionResult: MethodReconstructionResult
	repositoryTestSuiteResult: RepositoryTestSuiteResult
	sourceFileWithReconstructedMethodBody: string
	sourceFileWithOriginalMethodBody: string
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
	methodFileContentWithoutMethodBody: string
	reconstructedMethodBody: string
	systemPrompt: string
	userPrompt: string
	reasoningText?: string
}
