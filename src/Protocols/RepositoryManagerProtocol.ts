import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"

export type SourceFileChangesReversionOptions = {
	repositoryName: RepositoryName
	sourceFileWithOriginalMethodBody: string
	methodRelativeFilePath: string
}

export type SourceFileWithOriginalMethodBodyOptions = {
	repositoryName: RepositoryName
	methodRelativeFilePath: string
}

export type SourceFileWithReconstructedMethodBodyOptions = {
	repositoryName: RepositoryName,
	reconstructedMethodBody: string,
	methodRelativeFilePath: string
	methodDeclarationType: DeclarationType
	methodName: string
}
