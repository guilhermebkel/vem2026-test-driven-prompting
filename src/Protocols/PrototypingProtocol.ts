import { RepositoryName } from "@/Protocols/RepositoryProtocol"

export type PrototypeOptions = {
	repositoryName: RepositoryName
}

export type PrototypeResultItem = {
	repositoryName: RepositoryName
	methodTitle: string
	testSuiteCount: number
	testCaseCount: number
}

export type PrototypeResult = PrototypeResultItem[]
