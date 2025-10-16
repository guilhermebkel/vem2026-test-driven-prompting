import { LanguageModelName } from "@/Protocols/ModelProtocol"
import { ContextDefinition } from "@/Protocols/ContextProtocol"

export type RepositoryName = "date-fns"

export type MethodDefinition = {
	name: string
	repositoryName: RepositoryName
	testRelativeFilePath: string
}

export type RunExperimentOptions = {
	method: MethodDefinition
	reconstructionOptions: MethodReconstructionOptions
}

export type ExperimentResult = {
	reconstructedMethod: string
}

export type MethodReconstructionOptions = {
	context: ContextDefinition
	model: {
		name: LanguageModelName
		reasoning: boolean
		temperature: number
	}
}
