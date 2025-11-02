import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { CoverageReport } from "@/Protocols/TestExecutorProtocol"

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
	testCoverageReport: CoverageReport
}

export type MethodExplorerWorkerResult = ExploredMethod[]
