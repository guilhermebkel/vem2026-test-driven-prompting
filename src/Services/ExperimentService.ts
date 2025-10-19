import { generateText } from "ai"
import { exec } from "child_process"
import { promisify } from "util"

import {
	ExperimentOptions,
	ExperimentResult,
	MethodDefinition,
	MethodReconstructionOptions,
	MethodReconstructionResult,
	RepositoryTestSuiteResult
} from "@/Protocols/ExperimentProtocol"

import ModelUtil from "@/Utils/ModelUtil"
import FileUtil from "@/Utils/FileUtil"
import ExperimentUtil from "@/Utils/ExperimentUtil"
import NotificationUtil from "@/Utils/NotificationUtil"

import PromptService from "@/Services/PromptService"
import ContextService from "@/Services/ContextService"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"

class ExperimentService {
	async runExperiment(options: ExperimentOptions): Promise<ExperimentResult> {
		const sourceFileWithOriginalMethod = await this.getSourceFileWithOriginalMethod(options.method)

		try {
			const methodReconstructionResult = await this.reconstructMethod(options.method, options.reconstructionOptions)

			const sourceFileWithReconstructedMethod = await this.replaceSourceFileWithReconstructedMethodBody(options.method, methodReconstructionResult.reconstructedMethodBody)

			const repositoryTestSuiteResult = await this.runRepositoryTestSuite(options.method)

			const experimentResult: ExperimentResult = {
				methodReconstructionResult,
				repositoryTestSuiteResult,
				sourceFileWithReconstructedMethod,
				sourceFileWithOriginalMethod
			}

			await this.saveExperimentResultLogs(options, experimentResult)

			return experimentResult
		} catch (error) {
			ErrorHandlerUtil.handle(error)
			throw error
		} finally {
			await this.revertSourceFileChanges(options.method, sourceFileWithOriginalMethod)
		}
	}

	private async reconstructMethod(methodDefinition: MethodDefinition, options: MethodReconstructionOptions): Promise<MethodReconstructionResult> {
		return await NotificationUtil.runInnerAction("Reconstructing method body...", async () => {
			const {
				buildedContext,
				methodFileContentWithoutMethodBody,
				methodTestContent
			} = await NotificationUtil.runInnerAction("Retrieving context, test content and source file without method body...", async () => {
				const contextDefinitionWithResolvedRelativePath = ExperimentUtil.resolveContextRelativeFilePath(options.context, methodDefinition.repositoryName)
				const buildedContext = await ContextService.buildContext(contextDefinitionWithResolvedRelativePath)

				const methodTestFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.testRelativeFilePath)
				const methodTestContent = await FileUtil.getFileContent(methodTestFilePath)

				const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)
				const methodFileContentWithoutMethodBody = NodeJSCodeParserUtil.removeSpecificMethodOrFunctionBodyInSourceFile(methodFilePath, { type: methodDefinition.declarationType, name: methodDefinition.name })

				return {
					buildedContext,
					methodTestContent,
					methodFileContentWithoutMethodBody
				}
			})

			const {
				reconstructedMethodBody,
				systemPrompt,
				userPrompt
			} = await NotificationUtil.runInnerAction("Reconstructing method body with LLM...", async () => {
				const languageModel = ModelUtil.getLanguageModel(options.model.name)
				const buildedSystemPrompt = PromptService.buildSystemPrompt()
				const buildedUserPrompt = PromptService.buildUserPrompt({ methodName: methodDefinition.name, methodTestContent, methodFileContentWithoutMethodBody, buildedContext })

				const { text: reconstructedMethodBody } = await generateText({
					model: languageModel,
					messages: [
						{
							role: "system",
							content: buildedSystemPrompt
						},
						{
							role: "user",
							content: buildedUserPrompt
						}
					],
					temperature: options.model.temperature,
					providerOptions: {
						google: {
							thinkingConfig: {
								thinkingBudget: options.model.reasoningBudget
							}
						}
					}
				})

				return {
					userPrompt: buildedUserPrompt,
					systemPrompt: buildedSystemPrompt,
					reconstructedMethodBody
				}
			})

			return {
				methodFileContentWithoutMethodBody,
				reconstructedMethodBody,
				systemPrompt,
				userPrompt
			}
		})
	}

	private async revertSourceFileChanges(methodDefinition: MethodDefinition, originalSourceFile: string): Promise<void> {
		return await NotificationUtil.runInnerAction("Reverting source file changes...", async () => {
			const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)
			await FileUtil.setFileContent(methodFilePath, originalSourceFile)
		})
	}

	private async getSourceFileWithOriginalMethod(methodDefinition: MethodDefinition): Promise<string> {
		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

		const sourceFileWithOriginalMethod = await FileUtil.getFileContent(methodFilePath)

		return sourceFileWithOriginalMethod
	}

	private async replaceSourceFileWithReconstructedMethodBody(methodDefinition: MethodDefinition, reconstructedMethodBody: string): Promise<string> {
		return await NotificationUtil.runInnerAction("Replacing source file with reconstructed method body...", async () => {
			const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

			const sourceFileWithReconstructedMethod = NodeJSCodeParserUtil.replaceSpecificMethodOrFunctionBodyInSourceFile(
				methodFilePath,
				{ type: methodDefinition.declarationType, name: methodDefinition.name },
				reconstructedMethodBody
			)

			await FileUtil.setFileContent(methodFilePath, sourceFileWithReconstructedMethod)

			return sourceFileWithReconstructedMethod
		})
	}

	private async runRepositoryTestSuite(methodDefinition: MethodDefinition): Promise<RepositoryTestSuiteResult> {
		return await NotificationUtil.runInnerAction("Running method tests...", async () => {
			try {
				const repositoryRootPath = ExperimentUtil.getRepositoryRootPath(methodDefinition.repositoryName)

				const execAsync = promisify(exec)

				const { stdout } = await execAsync(methodDefinition.repositoryTestSuiteCommand, {
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

	private async saveExperimentResultLogs(experimentOptions: ExperimentOptions, experimentResult: ExperimentResult): Promise<void> {
		return await NotificationUtil.runInnerAction("Saving experiment result logs...", async () => {
			await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "testSuiteDebugMessage"), experimentResult.repositoryTestSuiteResult.debugMessage)
			await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "sourceFileWithReconstructedMethod"), experimentResult.sourceFileWithReconstructedMethod)
			await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "sourceFileWithOriginalMethod"), experimentResult.sourceFileWithOriginalMethod)
			await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "sourceFileWithoutOriginalMethodBody"), experimentResult.methodReconstructionResult.methodFileContentWithoutMethodBody)
			await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "userPrompt"), experimentResult.methodReconstructionResult.userPrompt)
			await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "systemPrompt"), experimentResult.methodReconstructionResult.systemPrompt)
		})
	}
}

export default new ExperimentService()
