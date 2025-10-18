import { BuildedContext } from "@/Protocols/ContextProtocol"

export type UserPromptOptions = {
	method: {
		name: string
		testContent: string
	}
	buildedContext: BuildedContext
	methodFileContentWithoutMethodBody: string
}
