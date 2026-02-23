import { RepositoryName } from "@/Protocols/RepositoryProtocol"

export type PrototypeOptions = {
	repositoryName: RepositoryName
}

export type PrototypeResult = {
	testCaseDistributionByMethod: TestCaseDistributionByMethod[]
}

export type TestCaseDistributionByMethod = {
	id: string
	repositoryName: RepositoryName
	methodTitle: string
	testSuiteCount: number
	testCaseCount: number
}