import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { TestRunnerId } from "@/Protocols/MutationTestProtocol"

export type PrototypeOptions = {
	repositoryName: RepositoryName
	testRunnerId: TestRunnerId
}

export type PrototypeResult = {
	testCaseDistributionByMethod: TestCaseDistributionByMethod[]
	testRelevanceByMethod: TestRelevanceByMethod[]
}

export type TestCaseDistributionByMethod = {
	id: string
	repositoryName: RepositoryName
	methodTitle: string
	testSuiteCount: number
	testCaseCount: number
}

export type TestRelevanceByMethod = {
	id: string
	repositoryName: RepositoryName
	methodTitle: string
	testCaseCount: number
	testCaseMutationRelevanceCount: number
	testCases: Array<{
		name: string
		mutationScore: "relevant" | "not-relevant" | "unknown"
	}>
}
