import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"

export type SourceFileChangesReversionOptions = {
	repositoryName: RepositoryName
	sourceFileWithOriginalMethodBody: string
	methodResolvedFilePath: string
}

export type SourceFileWithOriginalMethodBodyOptions = {
	repositoryName: RepositoryName
	methodResolvedFilePath: string
}

export type SourceFileWithReconstructedMethodBodyOptions = {
	repositoryName: RepositoryName,
	reconstructedMethodBody: string,
	methodResolvedFilePath: string
	methodDeclarationType: DeclarationType
	methodName: string
}
