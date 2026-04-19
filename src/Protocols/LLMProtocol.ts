import { LanguageModelName } from "@/Protocols/ModelProtocol"

export type MethodReconstructionOptions = {
	model: {
		name: LanguageModelName
		temperature: number
	}
	systemPrompt: string
	userPrompt: string
}

export type MethodReconstructionResult = {
	reconstructedMethodBody: string
	reasoningText?: string
}
