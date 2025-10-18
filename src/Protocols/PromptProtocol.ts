import { BuildedContext } from "@/Protocols/ContextProtocol"

export type UserPromptOptions = {
	methodName: string
	methodTestContent: string
	methodFileContentWithoutMethodBody: string
	buildedContext: BuildedContext
}
