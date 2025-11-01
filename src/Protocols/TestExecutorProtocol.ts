import { RepositoryName } from "@/Protocols/RepositoryProtocol"

export type RepositoryTestSuiteOptions = {
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
}

export type RepositoryTestSuiteResult = {
	success: boolean
	debugMessage: string
}
