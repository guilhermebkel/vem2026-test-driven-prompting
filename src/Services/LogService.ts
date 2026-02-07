import path from "path"

import TracingUtil from "@/Utils/TracingUtil"
import FileUtil from "@/Utils/FileUtil"
import PathUtil from "@/Utils/PathUtil"

import { MethodReconstructionExperimentationOptions, MethodReconstructionExperimentationResult } from "@/Protocols/ExperimentationProtocol"
import { MethodContextExplorationOptions, MethodContextExplorationResult, MethodExplorationOptions, MethodExplorationResult } from "@/Protocols/ExplorationProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"

class LogService {
	async saveMethodReconstructionExperimentLogs(methodReconstructionExperimentationOptions: MethodReconstructionExperimentationOptions, methodReconstructionExperimentationResult: MethodReconstructionExperimentationResult): Promise<void> {
		return await TracingUtil.traceAction("Saving experiment result logs...", async () => {
			await Promise.all(
				methodReconstructionExperimentationResult.experimentResult.map(async experimentResult => {
					const {
						repositoryName
					} = methodReconstructionExperimentationOptions.experimentOptions

					const {
						methodReconstructionResult,
						repositoryTestSuiteResult,
						sourceFileWithOriginalMethodBody,
						sourceFileWithReconstructedMethodBody,
						experimentTitle
					} = experimentResult

					const sourceFileExtension = path.extname(methodReconstructionResult.methodResolvedFilePath)
					const logPath: string[] = ["method-reconstruction-experiment", repositoryName, experimentTitle]

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

					const reasoningLogFilePath = this.getLogFilePath(logPath, "reasoning", ".md")
					await FileUtil.setFileContent(reasoningLogFilePath, methodReconstructionResult.reasoningText || "")
				})
			)
		})
	}

	async saveMethodExplorationLogs(methodExplorationOptions: MethodExplorationOptions, methodExplorationResult: MethodExplorationResult): Promise<void> {
		const { exploreOptions } = methodExplorationOptions
		const { exploreResult } = methodExplorationResult

		const methodExplorationResultLogFilePath = this.getMethodExplorationResultLogFilePath(exploreOptions.repositoryName)
		await FileUtil.setFileContent(methodExplorationResultLogFilePath, JSON.stringify(exploreResult, null, 2))
	}

	getMethodExplorationResultLogFilePath(repositoryName: RepositoryName): string {
		const logPath: string[] = ["method-exploration", repositoryName]

		return this.getLogFilePath(logPath, "exploreResult", ".json")
	}

	async saveMethodContextExplorationLogs(methodContextExplorationOptions: MethodContextExplorationOptions, methodContextExplorationResult: MethodContextExplorationResult): Promise<void> {
		const { exploreOptions } = methodContextExplorationOptions
		const { exploreResult } = methodContextExplorationResult

		const methodExplorationResultLogFilePath = this.getMethodContextExplorationResultLogFilePath(exploreOptions.repositoryName)
		await FileUtil.setFileContent(methodExplorationResultLogFilePath, JSON.stringify(exploreResult, null, 2))
	}

	getMethodContextExplorationResultLogFilePath(repositoryName: RepositoryName): string {
		const logPath: string[] = ["method-context-exploration", repositoryName]

		return this.getLogFilePath(logPath, "exploreResult", ".json")
	}

	private getLogFilePath(logPath: string[], logFileName: string, logFileExtension = ".txt"): string {
		const logDirectoryPath = PathUtil.getLogsDirectoryPath()

		const logFilePath = path.join(logDirectoryPath, ...logPath, `${logFileName}${logFileExtension}`)

		return logFilePath
	}
}

export default new LogService()
