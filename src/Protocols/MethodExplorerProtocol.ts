import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { SerializedSharedData } from "@/Protocols/WorkerProtocol"

export type ExploredMethod = {
	name?: string
	declarationType?: DeclarationType
	resolvedMethodFilePath: string
	resolvedTestFilePath?: string
	testCoveragePercentage: number
}

export type ExploreOptions = {
	repositoryName: RepositoryName
	/**
	 * Examples:
	 * - \/**\/*.js
	 * - \/**\/*.ts
	 */
	methodFilePatterns: string[]
	/**
	 * Examples:
	 * - \/**\/*.spec.\*
	 * - \/**\/*.test.\*
	 */
	testFilePatterns: string[]
	repositoryTestSuiteWithCoverageReportCommand: string
	coverageReportFilePattern: string
}

export type ExploreResult = ExploredMethod[]

export type MethodExplorerWorkerOptions = {
	methodFilePaths: string[]
	testFilePaths: string[]
	testFilePatterns: string[]
	repositoryName: RepositoryName
	serializedSharedTestCoverageReport: SerializedSharedData
}

export type MethodExplorerWorkerResult = ExploredMethod[]
