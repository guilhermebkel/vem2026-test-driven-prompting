import { RepositoryName } from "@/Protocols/RepositoryProtocol"

export type PrototypeOptions = {
	repositoryName: RepositoryName
}

export type PrototypeResult = Array<{
	testFilePath: string
	testCaseCount: number
}>
