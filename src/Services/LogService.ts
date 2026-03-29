import path from "path"

import TracingUtil from "@/Utils/TracingUtil"
import FileUtil from "@/Utils/FileUtil"
import PathUtil from "@/Utils/PathUtil"

import { MethodReconstructionExperimentationOptions, MethodReconstructionExperimentationResult } from "@/Protocols/ExperimentationProtocol"
import { MethodContextExplorationOptions, MethodContextExplorationResult, MethodExplorationOptions, MethodExplorationResult } from "@/Protocols/ExplorationProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { PrototypeOptions, PrototypeResult } from "@/Protocols/PrototypingProtocol"

class LogService {
	async saveMethodReconstructionExperimentLogs(methodReconstructionExperimentationOptions: MethodReconstructionExperimentationOptions, methodReconstructionExperimentationResult: MethodReconstructionExperimentationResult): Promise<void> {
		return await TracingUtil.traceAction("Saving experiment result logs...", async () => {
			await Promise.all(
				methodReconstructionExperimentationResult.experimentResult.map(async experimentResult => {
					const sourceFileExtension = path.extname(experimentResult.experiment.input.methodResolvedFilePath)
					const generalLogPath: string[] = ["method-reconstruction-experiment", methodReconstructionExperimentationOptions.experimentOptions.repositoryName]

					const rawLogPath: string[] = [...generalLogPath, "raw", experimentResult.experiment.input.experimentTitle]
					const testSuiteDebugMessageLogFilePath = this.getLogFilePath(rawLogPath, "testSuiteDebugMessage")
					await FileUtil.setFileContent(testSuiteDebugMessageLogFilePath, experimentResult.experiment.output.repositoryTestSuiteResult.debugMessage)
					const sourceFileWithReconstructedMethodBodyLogFilePath = this.getLogFilePath(rawLogPath, "sourceFileWithReconstructedMethodBody", sourceFileExtension)
					await FileUtil.setFileContent(sourceFileWithReconstructedMethodBodyLogFilePath, experimentResult.experiment.output.sourceFileWithReconstructedMethodBody)
					const sourceFileWithOriginalMethodBodyLogFilePath = this.getLogFilePath(rawLogPath, "sourceFileWithOriginalMethodBody", sourceFileExtension)
					await FileUtil.setFileContent(sourceFileWithOriginalMethodBodyLogFilePath, experimentResult.experiment.output.sourceFileWithOriginalMethodBody)
					const sourceFileWithoutOriginalMethodBodyLogFilePath = this.getLogFilePath(rawLogPath, "sourceFileWithoutOriginalMethodBody", sourceFileExtension)
					await FileUtil.setFileContent(sourceFileWithoutOriginalMethodBodyLogFilePath, experimentResult.experiment.output.methodFileContentWithoutMethodBody)
					const userPromptLogFilePath = this.getLogFilePath(rawLogPath, "userPrompt", ".md")
					await FileUtil.setFileContent(userPromptLogFilePath, experimentResult.model.input.userPrompt)
					const systemPromptLogFilePath = this.getLogFilePath(rawLogPath, "systemPrompt", ".md")
					await FileUtil.setFileContent(systemPromptLogFilePath, experimentResult.model.input.systemPrompt)
					const reasoningLogFilePath = this.getLogFilePath(rawLogPath, "reasoning", ".md")
					await FileUtil.setFileContent(reasoningLogFilePath, experimentResult.model.output.reasoningText || "")

					const structuredLogPath: string[] = [...generalLogPath, "structured"]
					const structuredCSVLogPath = this.getLogFilePath(structuredLogPath, "result", ".csv")
					await FileUtil.appendCSVRow(structuredCSVLogPath, {
						repositoryName: methodReconstructionExperimentationOptions.experimentOptions.repositoryName,
						methodName: experimentResult.experiment.input.methodName,
						methodResolvedFilePath: experimentResult.experiment.input.methodResolvedFilePath,
						experimentTitle: experimentResult.experiment.input.experimentTitle,
						experimentContextSlugs: experimentResult.experiment.input.contextDefinitions.map(definition => definition.slug).join("|"),
						modelSystemPrompt: JSON.stringify(experimentResult.model.input.systemPrompt),
						modelUserPrompt: JSON.stringify(experimentResult.model.input.userPrompt),
						modelReasoningTextResult: JSON.stringify(experimentResult.model.output.reasoningText),
						modelName: experimentResult.model.input.name,
						modelReasoningBudget: experimentResult.model.input.reasoningBudget,
						modelTemperature: experimentResult.model.input.temperature,
						modelResult: JSON.stringify(experimentResult.model.output.result),
						isTestSuiteSuccessful: experimentResult.metrics.isTestSuiteSuccessful,
						isModelResultCompilable: experimentResult.metrics.isModelResultCompilable,
						relevantTestCaseCount: experimentResult.metrics.relevantTestCaseCount,
						testSuiteTotalTestCaseCount: experimentResult.metrics.testSuiteTotalTestCaseCount,
						testSuitePassedTestCaseCount: experimentResult.metrics.testSuitePassedTestCaseCount
					})
				})
			)
		})
	}

	getMethodExplorationResultLogFilePath(repositoryName: RepositoryName): string {
		const logPath: string[] = ["method-exploration", repositoryName]

		return this.getLogFilePath(logPath, "exploreResult", ".json")
	}

	async saveMethodExplorationLogs(methodExplorationOptions: MethodExplorationOptions, methodExplorationResult: MethodExplorationResult): Promise<void> {
		const { exploreOptions } = methodExplorationOptions
		const { exploreResult } = methodExplorationResult

		const methodExplorationResultLogFilePath = this.getMethodExplorationResultLogFilePath(exploreOptions.repositoryName)
		await FileUtil.setFileContent(methodExplorationResultLogFilePath, JSON.stringify(exploreResult, null, 2))
	}

	getMethodContextExplorationResultLogFilePath(repositoryName: RepositoryName): string {
		const logPath: string[] = ["method-context-exploration", repositoryName]

		return this.getLogFilePath(logPath, "exploreResult", ".json")
	}

	async saveMethodContextExplorationLogs(methodContextExplorationOptions: MethodContextExplorationOptions, methodContextExplorationResult: MethodContextExplorationResult): Promise<void> {
		const { exploreOptions } = methodContextExplorationOptions
		const { exploreResult } = methodContextExplorationResult

		const methodExplorationResultLogFilePath = this.getMethodContextExplorationResultLogFilePath(exploreOptions.repositoryName)
		await FileUtil.setFileContent(methodExplorationResultLogFilePath, JSON.stringify(exploreResult, null, 2))
	}

	getPrototypeResultLogFilePath(repositoryName: RepositoryName, prototypeItemName: keyof PrototypeResult): string {
		const logPath: string[] = ["prototype", repositoryName]

		return this.getLogFilePath(logPath, prototypeItemName, ".json")
	}

	async savePrototypeLogs(prototypeOptions: PrototypeOptions, prototypeResult: PrototypeResult): Promise<void> {
		await Promise.all(
			Object.entries(prototypeResult).map(async ([prototypeItemName, value]) => {
				const prototypeLogFilePath = this.getPrototypeResultLogFilePath(prototypeOptions.repositoryName, <keyof PrototypeResult>prototypeItemName)
				await FileUtil.setFileContent(prototypeLogFilePath, JSON.stringify(value, null, 2))
			})
		)
	}

	private getLogFilePath(logPath: string[], logFileName: string, logFileExtension = ".txt"): string {
		const logDirectoryPath = PathUtil.getLogsDirectoryPath()

		const logFilePath = path.join(logDirectoryPath, ...logPath, `${logFileName}${logFileExtension}`)

		return logFilePath
	}
}

export default new LogService()
