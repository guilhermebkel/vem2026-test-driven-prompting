import { generateText } from "ai"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

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
import TracingUtil from "@/Utils/TracingUtil"

import PromptService from "@/Services/PromptService"
import ContextService from "@/Services/ContextService"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"

class ExperimentService {
	async runExperiment(options: ExperimentOptions): Promise<ExperimentResult> {
		const sourceFileWithOriginalMethodBody = await this.getSourceFileWithOriginalMethodBody(options.method)

		try {
			const methodReconstructionResult = await this.reconstructMethod(options.method, options.reconstructionOptions)

			const sourceFileWithReconstructedMethodBody = await this.replaceSourceFileWithReconstructedMethodBody(options.method, methodReconstructionResult.reconstructedMethodBody)

			const repositoryTestSuiteResult = await this.runRepositoryTestSuite(options.method)

			const experimentResult: ExperimentResult = {
				methodReconstructionResult,
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

	private async reconstructMethod(methodDefinition: MethodDefinition, options: MethodReconstructionOptions): Promise<MethodReconstructionResult> {
		return await TracingUtil.traceAction("Reconstructing method body...", async () => {
			const {
				buildedContext,
				methodFileContentWithoutMethodBody,
				methodTestContent
			} = await TracingUtil.traceAction("Retrieving context, test content and source file without method body...", async () => {
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
			} = await TracingUtil.traceAction("Reconstructing method body with LLM...", async () => {
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

	private async revertSourceFileChanges(methodDefinition: MethodDefinition, sourceFileWithOriginalMethodBody: string): Promise<void> {
		return await TracingUtil.traceAction("Reverting source file changes...", async () => {
			const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)
			await FileUtil.setFileContent(methodFilePath, sourceFileWithOriginalMethodBody)
		})
	}

	private async getSourceFileWithOriginalMethodBody(methodDefinition: MethodDefinition): Promise<string> {
		return await TracingUtil.traceAction("Retrieving source file with original method body...", async () => {
			const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

			const sourceFileWithOriginalMethodBody = await FileUtil.getFileContent(methodFilePath)

			return sourceFileWithOriginalMethodBody
		})
	}

	private async replaceSourceFileWithReconstructedMethodBody(methodDefinition: MethodDefinition, reconstructedMethodBody: string): Promise<string> {
		return await TracingUtil.traceAction("Replacing source file with reconstructed method body...", async () => {
			const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

			const sourceFileWithReconstructedMethodBody = NodeJSCodeParserUtil.replaceSpecificMethodOrFunctionBodyInSourceFile(
				methodFilePath,
				{ type: methodDefinition.declarationType, name: methodDefinition.name },
				reconstructedMethodBody
			)

			await FileUtil.setFileContent(methodFilePath, sourceFileWithReconstructedMethodBody)

			return sourceFileWithReconstructedMethodBody
		})
	}

	private async runRepositoryTestSuite(methodDefinition: MethodDefinition): Promise<RepositoryTestSuiteResult> {
		return await TracingUtil.traceAction("Running method tests...", async () => {
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

			const userPromptLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "userPrompt")
			await FileUtil.setFileContent(userPromptLogFilePath, experimentResult.methodReconstructionResult.userPrompt)

			const systemPromptLogFilePath = ExperimentUtil.getExperimentResultLogFilePath(experimentOptions, "systemPrompt")
			await FileUtil.setFileContent(systemPromptLogFilePath, experimentResult.methodReconstructionResult.systemPrompt)
		})
	}
}

export default new ExperimentService()
