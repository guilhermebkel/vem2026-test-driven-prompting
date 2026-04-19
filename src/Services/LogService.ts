import path from "path"

import TracingUtil from "@/Utils/TracingUtil"
import FileUtil from "@/Utils/FileUtil"
import PathUtil from "@/Utils/PathUtil"

import { MethodReconstructionExperimentationOptions, MethodReconstructionExperimentationResult } from "@/Protocols/ExperimentationProtocol"
import { MethodContextExplorationOptions, MethodContextExplorationResult, MethodExplorationOptions, MethodExplorationResult } from "@/Protocols/ExplorationProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { PrototypeOptions, PrototypeResult } from "@/Protocols/PrototypingProtocol"

class LogService {
	getStructuredMethodReconstructionExperimentResultPathParts(repositoryName: RepositoryName): string[] {
		const generalLogPathParts: string[] = ["method-reconstruction-experiment", repositoryName]

		const rawLogPathParts: string[] = [...generalLogPathParts, "structured"]

		return rawLogPathParts
	}

	getRawMethodReconstructionExperimentResultPathParts(repositoryName: RepositoryName, experimentDescription: string): string[] {
		const generalLogPathParts: string[] = ["method-reconstruction-experiment", repositoryName]

		const rawLogPathParts: string[] = [...generalLogPathParts, "raw", experimentDescription]

		return rawLogPathParts
	}

	getRawMethodReconstructionExperimentResultFolderPath(repositoryName: RepositoryName, experimentDescription: string): string {
		const rawLogPathParts = this.getRawMethodReconstructionExperimentResultPathParts(repositoryName, experimentDescription)

		return this.getLogFolderPath(rawLogPathParts)
	}

	async saveMethodReconstructionExperimentLogs(methodReconstructionExperimentationOptions: MethodReconstructionExperimentationOptions, methodReconstructionExperimentationResult: MethodReconstructionExperimentationResult): Promise<void> {
		return await TracingUtil.traceAction("Saving experiment result logs...", async () => {
			await Promise.all(
				methodReconstructionExperimentationResult.experimentResult.map(async experimentResult => {
					const sourceFileExtension = path.extname(experimentResult.experiment.input.methodResolvedFilePath)
					const rawLogPathParts = this.getRawMethodReconstructionExperimentResultPathParts(methodReconstructionExperimentationOptions.experimentOptions.repositoryName, experimentResult.experiment.input.experimentDescription)

					const testSuiteDebugMessageLogFilePath = this.getLogFilePath(rawLogPathParts, "testSuiteDebugMessage")
					await FileUtil.setFileContent(testSuiteDebugMessageLogFilePath, experimentResult.experiment.output.repositoryTestSuiteResultDebugMessage)
					const sourceFileWithReconstructedMethodBodyLogFilePath = this.getLogFilePath(rawLogPathParts, "sourceFileWithReconstructedMethodBody", sourceFileExtension)
					await FileUtil.setFileContent(sourceFileWithReconstructedMethodBodyLogFilePath, experimentResult.experiment.output.sourceFileWithReconstructedMethodBody)
					const sourceFileWithOriginalMethodBodyLogFilePath = this.getLogFilePath(rawLogPathParts, "sourceFileWithOriginalMethodBody", sourceFileExtension)
					await FileUtil.setFileContent(sourceFileWithOriginalMethodBodyLogFilePath, experimentResult.experiment.output.sourceFileWithOriginalMethodBody)
					const sourceFileWithoutOriginalMethodBodyLogFilePath = this.getLogFilePath(rawLogPathParts, "sourceFileWithoutOriginalMethodBody", sourceFileExtension)
					await FileUtil.setFileContent(sourceFileWithoutOriginalMethodBodyLogFilePath, experimentResult.experiment.output.methodFileContentWithoutMethodBody)
					const userPromptLogFilePath = this.getLogFilePath(rawLogPathParts, "userPrompt", ".md")
					await FileUtil.setFileContent(userPromptLogFilePath, experimentResult.model.input.userPrompt)
					const systemPromptLogFilePath = this.getLogFilePath(rawLogPathParts, "systemPrompt", ".md")
					await FileUtil.setFileContent(systemPromptLogFilePath, experimentResult.model.input.systemPrompt)
					const reasoningLogFilePath = this.getLogFilePath(rawLogPathParts, "reasoning", ".md")
					await FileUtil.setFileContent(reasoningLogFilePath, experimentResult.model.output.reasoningText || "")

					const structuredLogPathParts = this.getStructuredMethodReconstructionExperimentResultPathParts(methodReconstructionExperimentationOptions.experimentOptions.repositoryName)
					const structuredCSVLogPath = this.getLogFilePath(structuredLogPathParts, "result", ".csv")
					await FileUtil.appendCSVRow(structuredCSVLogPath, {
						repositoryName: methodReconstructionExperimentationOptions.experimentOptions.repositoryName,
						methodName: experimentResult.experiment.input.methodName,
						methodResolvedFilePath: experimentResult.experiment.input.methodResolvedFilePath,
						experimentTitle: experimentResult.experiment.input.experimentTitle,
						experimentDescription: experimentResult.experiment.input.experimentDescription,
						experimentContextItemCount: experimentResult.experiment.input.experimentContextItemCount,
						experimentIndex: experimentResult.experiment.input.experimentIndex,
						experimentSize: experimentResult.experiment.input.experimentSize,
						experimentContextSlugs: experimentResult.experiment.input.contextDefinitions.map(definition => definition.slug).join("|"),
						modelSystemPrompt: JSON.stringify(experimentResult.model.input.systemPrompt),
						modelUserPrompt: JSON.stringify(experimentResult.model.input.userPrompt),
						modelReasoningTextResult: JSON.stringify(experimentResult.model.output.reasoningText || ""),
						modelName: experimentResult.model.input.name,
						modelTemperature: experimentResult.model.input.temperature,
						modelResult: JSON.stringify(experimentResult.model.output.result),
						testSuiteExecutionLog: JSON.stringify(experimentResult.experiment.output.repositoryTestSuiteResultDebugMessage),
						isTestSuiteSuccessful: experimentResult.metrics.isTestSuiteSuccessful,
						isModelResultCompilable: experimentResult.metrics.isModelResultCompilable,
						relevantTestCaseCount: experimentResult.metrics.relevantTestCaseCount,
						testSuiteTotalTestCaseCount: experimentResult.metrics.testSuiteTotalTestCaseCount,
						testSuitePassedTestCaseCount: experimentResult.metrics.testSuitePassedTestCaseCount,
						testSuiteFailedTestCaseCount: experimentResult.metrics.testSuiteFailedTestCaseCount
					})
				})
			)
		})
	}

	getMethodExplorationResultLogFilePath(repositoryName: RepositoryName): string {
		const logPathParts: string[] = ["method-exploration", repositoryName]

		return this.getLogFilePath(logPathParts, "exploreResult", ".json")
	}

	async saveMethodExplorationLogs(methodExplorationOptions: MethodExplorationOptions, methodExplorationResult: MethodExplorationResult): Promise<void> {
		const { exploreOptions } = methodExplorationOptions
		const { exploreResult } = methodExplorationResult

		const methodExplorationResultLogFilePath = this.getMethodExplorationResultLogFilePath(exploreOptions.repositoryName)
		await FileUtil.setFileContent(methodExplorationResultLogFilePath, JSON.stringify(exploreResult, null, 2))
	}

	getMethodContextExplorationResultLogFilePath(repositoryName: RepositoryName): string {
		const logPathParts: string[] = ["method-context-exploration", repositoryName]

		return this.getLogFilePath(logPathParts, "exploreResult", ".json")
	}

	async saveMethodContextExplorationLogs(methodContextExplorationOptions: MethodContextExplorationOptions, methodContextExplorationResult: MethodContextExplorationResult): Promise<void> {
		const { exploreOptions } = methodContextExplorationOptions
		const { exploreResult } = methodContextExplorationResult

		const methodExplorationResultLogFilePath = this.getMethodContextExplorationResultLogFilePath(exploreOptions.repositoryName)
		await FileUtil.setFileContent(methodExplorationResultLogFilePath, JSON.stringify(exploreResult, null, 2))
	}

	getPrototypeResultLogFilePath(repositoryName: RepositoryName, prototypeItemName: keyof PrototypeResult): string {
		const logPathParts: string[] = ["prototype", repositoryName]

		return this.getLogFilePath(logPathParts, prototypeItemName, ".json")
	}

	async savePrototypeLogs(prototypeOptions: PrototypeOptions, prototypeResult: PrototypeResult): Promise<void> {
		await Promise.all(
			Object.entries(prototypeResult).map(async ([prototypeItemName, value]) => {
				const prototypeLogFilePath = this.getPrototypeResultLogFilePath(prototypeOptions.repositoryName, <keyof PrototypeResult>prototypeItemName)
				await FileUtil.setFileContent(prototypeLogFilePath, JSON.stringify(value, null, 2))
			})
		)
	}

	private getLogFolderPath(logPathParts: string[]): string {
		const logDirectoryPath = PathUtil.getLogsDirectoryPath()

		const logFolderPath = path.join(logDirectoryPath, ...logPathParts)

		return logFolderPath
	}

	private getLogFilePath(logPathParts: string[], logFileName: string, logFileExtension = ".txt"): string {
		const logDirectoryPath = PathUtil.getLogsDirectoryPath()

		const logFilePath = path.join(logDirectoryPath, ...logPathParts, `${logFileName}${logFileExtension}`)

		return logFilePath
	}
}

export default new LogService()
