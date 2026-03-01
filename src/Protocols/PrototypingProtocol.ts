import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { CustomStrykerOptions } from "@/Protocols/TestMutationRelevanceProtocol"

export type PrototypeOptions = {
	repositoryName: RepositoryName
	testRelevanceOptions: {
		customStrykerOptions: CustomStrykerOptions
	}
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

export type RelevanceScore = "relevant" | "not-relevant" | "unknown"

export type TestCaseRelevance = {
	name: string
	mutationScore: RelevanceScore
	dataFlowScore: RelevanceScore
}

export type TestRelevanceByMethod = {
	id: string
	repositoryName: RepositoryName
	methodTitle: string
	testCaseCount: number
	testCaseRelevanceCount: {
		byMutationScore: number
		byDataFlowScore: number
	}
	testCases: TestCaseRelevance[]
}
