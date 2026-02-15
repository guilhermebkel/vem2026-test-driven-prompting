import { RepositoryName } from "@/Protocols/RepositoryProtocol"

export type PrototypeOptions = {
	repositoryName: RepositoryName
}

export type PrototypeResult = {
	testCaseDistributionByMethod: TestCaseDistributionByMethod[]
}

export type TestCaseDistributionByMethod = {
	repositoryName: RepositoryName
	methodTitle: string
	testSuiteCount: number
	testCaseCount: number
}