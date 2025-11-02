import FileUtil from "@/Utils/FileUtil"

import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"
import ShellUtil from "@/Utils/ShellUtil"

import {
	RepositoryTestSuiteOptions,
	RepositoryTestSuiteResult,
	RepositoryTestSuiteCoverageReportOptions,
	RepositoryTestSuiteCoverageReportResult,
	CoverageReport
} from "@/Protocols/TestExecutorProtocol"

class TestExecutorService {
	async runRepositoryTestSuite(options: RepositoryTestSuiteOptions): Promise<RepositoryTestSuiteResult> {
		return await TracingUtil.traceAction("Running method tests...", async () => {
			try {
				const repositoryRootPath = PathUtil.getRepositoryRootPath(options.repositoryName)

				const result = await ShellUtil.executeCommand(options.repositoryTestSuiteCommand, repositoryRootPath)

				return {
					success: true,
					debugMessage: result
				}
			} catch (error) {
				const typedError = error as Error

				return {
					success: false,
					debugMessage: typedError.message
				}
			}
		})
	}

	async collectCoverageReportFromRepositoryTestSuite(options: RepositoryTestSuiteCoverageReportOptions): Promise<RepositoryTestSuiteCoverageReportResult> {
		const repositoryRootPath = PathUtil.getRepositoryRootPath(options.repositoryName)
		await ShellUtil.executeCommand(options.repositoryTestSuiteWithCoverageReportCommand, repositoryRootPath)

		const resolvedCoverageReportFilePaths = await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, [options.coverageReportFilePattern])

		let coverageReport: CoverageReport = {}

		await Promise.all(
			resolvedCoverageReportFilePaths.map(async resolvedCoverageReportFilePath => {
				const coverageReportInString = await FileUtil.getFileContent(resolvedCoverageReportFilePath)

				coverageReport = {
					...coverageReport,
					...JSON.parse(coverageReportInString)
				}
			})
		)

		return coverageReport
	}
}

export default new TestExecutorService()
