import path from "path"

import TracingUtil from "@/Utils/TracingUtil"
import FileUtil from "@/Utils/FileUtil"

import { MethodReconstructionExperimentOptions, MethodReconstructionExperimentResult } from "@/Protocols/ExperimentationProtocol"
import { MethodExplorationOptions, MethodExplorationResult } from "@/Protocols/ExplorationProtocol"

class LogService {
	async saveMethodReconstructionExperimentLogs(methodReconstructionExperimentOptions: MethodReconstructionExperimentOptions, methodReconstructionExperimentResult: MethodReconstructionExperimentResult): Promise<void> {
		return await TracingUtil.traceAction("Saving experiment result logs...", async () => {
			const {
				method,
				title
			} = methodReconstructionExperimentOptions

			const {
				methodReconstructionResult,
				repositoryTestSuiteResult,
				sourceFileWithOriginalMethodBody,
				sourceFileWithReconstructedMethodBody
			} = methodReconstructionExperimentResult

			const sourceFileExtension = path.extname(method.methodRelativeFilePath)
			const logPath: string[] = ["method-reconstruction-experiment", method.repositoryName, title]

			const testSuiteDebugMessageLogFilePath = this.getLogFilePath(logPath, "testSuiteDebugMessage")
			await FileUtil.setFileContent(testSuiteDebugMessageLogFilePath, repositoryTestSuiteResult.debugMessage)

			const sourceFileWithReconstructedMethodBodyLogFilePath = this.getLogFilePath(logPath, "sourceFileWithReconstructedMethodBody", sourceFileExtension)
			await FileUtil.setFileContent(sourceFileWithReconstructedMethodBodyLogFilePath, sourceFileWithReconstructedMethodBody)

			const sourceFileWithOriginalMethodBodyLogFilePath = this.getLogFilePath(logPath, "sourceFileWithOriginalMethodBody", sourceFileExtension)
			await FileUtil.setFileContent(sourceFileWithOriginalMethodBodyLogFilePath, sourceFileWithOriginalMethodBody)

			const sourceFileWithoutOriginalMethodBodyLogFilePath = this.getLogFilePath(logPath, "sourceFileWithoutOriginalMethodBody", sourceFileExtension)
			await FileUtil.setFileContent(sourceFileWithoutOriginalMethodBodyLogFilePath, methodReconstructionResult.methodFileContentWithoutMethodBody)

			const userPromptLogFilePath = this.getLogFilePath(logPath, "userPrompt", ".md")
			await FileUtil.setFileContent(userPromptLogFilePath, methodReconstructionResult.userPrompt)

			const systemPromptLogFilePath = this.getLogFilePath(logPath, "systemPrompt", ".md")
			await FileUtil.setFileContent(systemPromptLogFilePath, methodReconstructionResult.systemPrompt)

			const reasoningLogFilePath = this.getLogFilePath(logPath, "reasoning")
			await FileUtil.setFileContent(reasoningLogFilePath, methodReconstructionResult.reasoningText || "")
		})
	}

	async saveMethodExplorationLogs(methodExplorationOptions: MethodExplorationOptions, methodExplorationResult: MethodExplorationResult): Promise<void> {
		const {
			exploreOptions
		} = methodExplorationOptions

		const {
			exploreResult
		} = methodExplorationResult

		const logPath: string[] = ["method-exploration", exploreOptions.repositoryName]

		const exploreResultLogFilePath = this.getLogFilePath(logPath, "exploreResult", ".json")
		await FileUtil.setFileContent(exploreResultLogFilePath, JSON.stringify(exploreResult, null, 2))
	}

	private getLogFilePath(logPath: string[], logFileName: string, logFileExtension = ".txt"): string {
		const logDirectoryPath = this.getLogDirectoryPath()

		const logFilePath = path.join(logDirectoryPath, ...logPath, `${logFileName}${logFileExtension}`)

		return logFilePath
	}

	private getLogDirectoryPath(): string {
		const rootDirectoryPath = process.cwd()

		const logDirectoryPath = path.join(rootDirectoryPath, "logs")

		return logDirectoryPath
	}
}

export default new LogService()
