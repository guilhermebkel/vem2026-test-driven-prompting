import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"

export type RevertSourceFileChangesOptions = {
	sourceFileWithOriginalMethodBody: string
	methodResolvedFilePath: string
}

export type GetSourceFileWithOriginalMethodBodyOptions = {
	methodResolvedFilePath: string
}

export type SetSourceFileWithReconstructedMethodBodyOptions = {
	reconstructedMethodBody: string
	methodResolvedFilePath: string
	methodDeclarationType: DeclarationType
	methodName: string
}

export type CheckSourceFileCompilationOptions = {
	methodResolvedFilePath: string
}
