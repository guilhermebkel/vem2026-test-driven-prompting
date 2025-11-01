import { exec } from "child_process"
import { promisify } from "util"

import PathUtil from "@/Utils/PathUtil"
import TracingUtil from "@/Utils/TracingUtil"

import { RepositoryTestSuiteOptions, RepositoryTestSuiteResult } from "@/Protocols/TestExecutorProtocol"

class TestExecutorService {
	async runRepositoryTestSuite(options: RepositoryTestSuiteOptions): Promise<RepositoryTestSuiteResult> {
		return await TracingUtil.traceAction("Running method tests...", async () => {
			try {
				const repositoryRootPath = PathUtil.getRepositoryRootPath(options.repositoryName)

				const execAsync = promisify(exec)

				const { stdout } = await execAsync(options.repositoryTestSuiteCommand, {
					cwd: repositoryRootPath
				})

				return {
					success: true,
					debugMessage: stdout
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
