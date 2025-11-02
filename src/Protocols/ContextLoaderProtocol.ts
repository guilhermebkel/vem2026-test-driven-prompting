import { BuildedContext, ContextDefinition } from "@/Protocols/ContextProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"

export type ContextLoadOptions = {
	context: ContextDefinition
	repositoryName: RepositoryName
	method: {
		name: string
		declarationType: DeclarationType
		relativeFilePath: string
	}
	test: {
		relativeFilePath: string
	}
}

export type ContextLoadResult = {
	buildedContext: BuildedContext
	methodFileContentWithoutMethodBody: string
	methodTestContent: string
}