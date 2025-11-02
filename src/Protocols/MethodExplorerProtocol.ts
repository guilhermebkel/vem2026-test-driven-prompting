import { DeclarationType } from "@/Protocols/NodeJSCodeParserProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { MethodTestCoverageDetails } from "@/Protocols/TestCoverageProtocol"

export type ExploredMethod = {
	name?: string
	declarationType?: DeclarationType
	resolvedMethodFilePath: string
	resolvedTestFilePaths: string[]
	testCoverageDetails: MethodTestCoverageDetails
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

