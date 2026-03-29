import { BuildedContext } from "@/Protocols/ContextProtocol"

export type PromptBuildOptions = {
	methodName: string
	methodFileContentWithoutMethodBody: string
	buildedContext: BuildedContext
}

export type PromptBuildResult = {
	systemPrompt: string
	userPrompt: string
}
