import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"

import { RepositoryTestSuiteOptions, RepositoryTestSuiteResult } from "@/Protocols/TestExecutorProtocol"
import ShellUtil from "@/Utils/ShellUtil"

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
}

export default new TestExecutorService()
