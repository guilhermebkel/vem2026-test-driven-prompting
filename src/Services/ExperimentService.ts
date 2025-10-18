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

import PromptService from "@/Services/PromptService"
import ContextService from "@/Services/ContextService"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"

class ExperimentService {
	async runExperiment(options: ExperimentOptions): Promise<ExperimentResult> {
		const sourceFileWithOriginalMethod = await this.getSourceFileWithOriginalMethod(options.method)

		try {
			const methodReconstructionResult = await this.reconstructMethod(options.method, options.reconstructionOptions)

			const sourceFileWithReconstructedMethod = await this.getSourceFileWithReconstructedMethod(options.method, methodReconstructionResult.reconstructedMethodBody)

			await this.replaceSourceFile(options.method, sourceFileWithReconstructedMethod)

			const repositoryTestSuiteResult = await this.runRepositoryTestSuite(options.method)

			const experimentResult: ExperimentResult = {
				methodReconstructionResult,
				repositoryTestSuiteResult,
				sourceFileWithReconstructedMethod,
				sourceFileWithOriginalMethod
			}

			await this.saveExperimentResultLogs(options.method, experimentResult)

			return experimentResult
		} catch (error) {
			ErrorHandlerUtil.handle(error)
			throw error
		} finally {
			await this.replaceSourceFile(options.method, sourceFileWithOriginalMethod)
		}
	}

	private async reconstructMethod(methodDefinition: MethodDefinition, options: MethodReconstructionOptions): Promise<MethodReconstructionResult> {
		const contextDefinitionWithResolvedRelativePath = ExperimentUtil.resolveContextRelativeFilePath(options.context, methodDefinition.repositoryName)
		const buildedContext = await ContextService.buildContext(contextDefinitionWithResolvedRelativePath)

		const methodTestFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.testRelativeFilePath)
		const methodTestContent = await FileUtil.getFileContent(methodTestFilePath)

		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)
		const methodFileContentWithoutMethodBody = NodeJSCodeParserUtil.removeSpecificMethodOrFunctionBodyInSourceFile(methodFilePath, { type: methodDefinition.declarationType, name: methodDefinition.name })

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
			reconstructedMethodBody,
			systemPrompt: buildedSystemPrompt,
			userPrompt: buildedUserPrompt
		}
	}

	private async getSourceFileWithReconstructedMethod(methodDefinition: MethodDefinition, reconstructedMethodBody: string): Promise<string> {
		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

		const sourceFileWithReconstructedMethod = NodeJSCodeParserUtil.replaceSpecificMethodOrFunctionBodyInSourceFile(
			methodFilePath,
			{ type: methodDefinition.declarationType, name: methodDefinition.name },
			reconstructedMethodBody
		)

		return sourceFileWithReconstructedMethod
	}

	private async getSourceFileWithOriginalMethod(methodDefinition: MethodDefinition): Promise<string> {
		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

		const sourceFileWithOriginalMethod = await FileUtil.getFileContent(methodFilePath)

		return sourceFileWithOriginalMethod
	}

	private async replaceSourceFile(methodDefinition: MethodDefinition, changedSourceFile: string): Promise<void> {
		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)
		await FileUtil.setFileContent(methodFilePath, changedSourceFile)
	}

	private async runRepositoryTestSuite(methodDefinition: MethodDefinition): Promise<RepositoryTestSuiteResult> {
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
	}

	private async saveExperimentResultLogs(methodDefinition: MethodDefinition, experimentResult: ExperimentResult): Promise<void> {
		await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(methodDefinition, "testSuiteDebugMessage"), experimentResult.repositoryTestSuiteResult.debugMessage)
		await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(methodDefinition, "sourceFileWithReconstructedMethod"), experimentResult.sourceFileWithReconstructedMethod)
		await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(methodDefinition, "sourceFileWithOriginalMethod"), experimentResult.sourceFileWithOriginalMethod)
		await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(methodDefinition, "userPrompt"), experimentResult.methodReconstructionResult.userPrompt)
		await FileUtil.setFileContent(ExperimentUtil.getExperimentResultLogFilePath(methodDefinition, "systemPrompt"), experimentResult.methodReconstructionResult.systemPrompt)
	}
}

export default new ExperimentService()
