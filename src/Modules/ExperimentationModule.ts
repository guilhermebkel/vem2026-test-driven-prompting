import path from "path"

import {
	ExperimentOptions,
	ExperimentResult,
	MethodDefinition
} from "@/Protocols/ExperimentationProtocol"

import FileUtil from "@/Utils/FileUtil"
import ExperimentUtil from "@/Utils/ExperimentUtil"
import TracingUtil from "@/Utils/TracingUtil"
import PathUtil from "@/Utils/PathUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"

import TestExecutorService from "@/Services/TestExecutorService"
import ContextLoaderService from "@/Services/ContextLoaderService"
import PromptBuilderService from "@/Services/PromptBuilderService"
import MethodReconstructorService from "@/Services/MethodReconstructorService"

class ExperimentationModule {
	async runExperiment(options: ExperimentOptions): Promise<ExperimentResult> {
		const sourceFileWithOriginalMethodBody = await this.getSourceFileWithOriginalMethodBody(options.method)

		try {
			const contextLoadResult = await ContextLoaderService.loadContext({
				context: options.reconstructionOptions.context,
				method: {
					name: options.method.name,
					declarationType: options.method.declarationType,
					relativeFilePath: options.method.methodRelativeFilePath
				},
				repositoryName: options.method.repositoryName,
				test: {
					relativeFilePath: options.method.testRelativeFilePath
				}
			})

			const buildPromptResult = PromptBuilderService.buildPrompt({
				buildedContext: contextLoadResult.buildedContext,
				methodFileContentWithoutMethodBody: contextLoadResult.methodFileContentWithoutMethodBody,
				methodName: options.method.name,
				methodTestContent: contextLoadResult.methodTestContent
			})

			const methodReconstructionResult = await MethodReconstructorService.reconstructMethod({
				model: {
					name: options.reconstructionOptions.model.name,
					temperature: options.reconstructionOptions.model.temperature,
					reasoningBudget: options.reconstructionOptions.model.reasoningBudget
				},
				systemPrompt: buildPromptResult.systemPrompt,
				userPrompt: buildPromptResult.userPrompt
			})

			const sourceFileWithReconstructedMethodBody = await this.replaceSourceFileWithReconstructedMethodBody(options.method, methodReconstructionResult.reconstructedMethodBody)

			const repositoryTestSuiteResult = await TestExecutorService.runRepositoryTestSuite(options.method)

			const experimentResult: ExperimentResult = {
				methodReconstructionResult: {
					reconstructedMethodBody: methodReconstructionResult.reconstructedMethodBody,
					methodFileContentWithoutMethodBody: contextLoadResult.methodFileContentWithoutMethodBody,
					systemPrompt: buildPromptResult.systemPrompt,
					userPrompt: buildPromptResult.userPrompt
				},
				repositoryTestSuiteResult,
				sourceFileWithReconstructedMethodBody,
				sourceFileWithOriginalMethodBody
			}

			await this.saveExperimentResultLogs(options, experimentResult)

			return experimentResult
		} catch (error) {
			ErrorHandlerUtil.handle(error)
			throw error
		} finally {
			await this.revertSourceFileChanges(options.method, sourceFileWithOriginalMethodBody)
		}
	}

	private async revertSourceFileChanges(methodDefinition: MethodDefinition, sourceFileWithOriginalMethodBody: string): Promise<void> {
		return await TracingUtil.traceAction("Reverting source file changes...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)
			await FileUtil.setFileContent(methodFilePath, sourceFileWithOriginalMethodBody)
		})
	}

	private async getSourceFileWithOriginalMethodBody(methodDefinition: MethodDefinition): Promise<string> {
		return await TracingUtil.traceAction("Retrieving source file with original method body...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

			const sourceFileWithOriginalMethodBody = await FileUtil.getFileContent(methodFilePath)

			return sourceFileWithOriginalMethodBody
		})
	}

	private async replaceSourceFileWithReconstructedMethodBody(methodDefinition: MethodDefinition, reconstructedMethodBody: string): Promise<string> {
		return await TracingUtil.traceAction("Replacing source file with reconstructed method body...", async () => {
			const methodFilePath = PathUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

			const sourceFileWithReconstructedMethodBody = NodeJSCodeParserUtil.replaceSpecificMethodOrFunctionBodyInSourceFile(
				methodFilePath,
				{ type: methodDefinition.declarationType, name: methodDefinition.name },
				reconstructedMethodBody
			)

			await FileUtil.setFileContent(methodFilePath, sourceFileWithReconstructedMethodBody)

			return sourceFileWithReconstructedMethodBody
		})
	}

	private async saveExperimentResultLogs(experimentOptions: ExperimentOptions, experimentResult: ExperimentResult): Promise<void> {
		return await TracingUtil.traceAction("Saving experiment result logs...", async () => {
			const sourceFileExtension = path.extname(experimentOptions.method.methodRelativeFilePath)

			const testSuiteDebugMessageLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "testSuiteDebugMessage")
			await FileUtil.setFileContent(testSuiteDebugMessageLogFilePath, experimentResult.repositoryTestSuiteResult.debugMessage)

			const sourceFileWithReconstructedMethodBodyLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "sourceFileWithReconstructedMethodBody", sourceFileExtension)
			await FileUtil.setFileContent(sourceFileWithReconstructedMethodBodyLogFilePath, experimentResult.sourceFileWithReconstructedMethodBody)

			const sourceFileWithOriginalMethodBodyLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "sourceFileWithOriginalMethodBody", sourceFileExtension)
			await FileUtil.setFileContent(sourceFileWithOriginalMethodBodyLogFilePath, experimentResult.sourceFileWithOriginalMethodBody)

			const sourceFileWithoutOriginalMethodBodyLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "sourceFileWithoutOriginalMethodBody", sourceFileExtension)
			await FileUtil.setFileContent(sourceFileWithoutOriginalMethodBodyLogFilePath, experimentResult.methodReconstructionResult.methodFileContentWithoutMethodBody)

			const userPromptLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "userPrompt", ".md")
			await FileUtil.setFileContent(userPromptLogFilePath, experimentResult.methodReconstructionResult.userPrompt)

			const systemPromptLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "systemPrompt", ".md")
			await FileUtil.setFileContent(systemPromptLogFilePath, experimentResult.methodReconstructionResult.systemPrompt)

			const reasoningLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "reasoning", ".txt")
			await FileUtil.setFileContent(reasoningLogFilePath, experimentResult.methodReconstructionResult.reasoningText || "")
		})
	}
}

export default new ExperimentationModule()
