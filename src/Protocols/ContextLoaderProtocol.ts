import { BuildedContext, ContextDefinition } from "@/Protocols/ContextProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"

export type ContextLoadOptions = {
	context: ContextDefinition
	repositoryName: RepositoryName
	method: {
		name: string
		declarationType: DeclarationType
		resolvedFilePath: string
	}
	test: {
		resolvedFilePath: string
	}
}

export type ContextLoadResult = {
	buildedContext: BuildedContext
	methodFileContentWithoutMethodBody: string
	methodTestContent: string
}