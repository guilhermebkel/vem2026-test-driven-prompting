import { LanguageModelName } from "@/Protocols/ModelProtocol"
import { ContextDefinitionItem } from "./ContextProtocol"

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

export type MethodReconstructionOptions = {
	context: ContextDefinitionItem[]
	model: {
		name: LanguageModelName
		reasoning: boolean
		temperature: number
	}
}
