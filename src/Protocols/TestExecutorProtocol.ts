import { RepositoryName } from "@/Protocols/RepositoryProtocol"

export type RepositoryTestSuiteOptions = {
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
}

export type RepositoryTestSuiteResult = {
	success: boolean
	debugMessage: string
}

export type RepositoryTestSuiteCoverageReportOptions = {
	repositoryName: RepositoryName
	repositoryTestSuiteWithCoverageReportCommand: string
	coverageReportFilePattern: string
}

export type CoverageReport = Record<string, {
	all?: boolean
	statementMap: {
		[key: string]: {
			start: { line: number; column: number }
			end: { line: number; column: number }
		}
	}
	s: Record<string, number>
	branchMap: {
		[key: string]: {
			type: string
			line: number
			loc: Location
			locations: Array<{
				start: { line: number; column: number }
				end: { line: number; column: number }
			}>
		}
	}
	b: Record<string, number[]>
	fnMap: {
		[key: string]: {
			name: string
			decl: Location
			loc: Location
			line: number
		}
	}
	f: Record<string, number>
}>

export type RepositoryTestSuiteCoverageReportResult = CoverageReport
