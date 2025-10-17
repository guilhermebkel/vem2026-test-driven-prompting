import { generateText } from "ai"

import { ExperimentResult, MethodDefinition, MethodReconstructionOptions, RunExperimentOptions } from "@/Protocols/ExperimentProtocol"

import ModelUtil from "@/Utils/ModelUtil"
import FileUtil from "@/Utils/FileUtil"
import ExperimentUtil from "@/Utils/ExperimentUtil"

import PromptService from "@/Services/PromptService"
import ContextService from "@/Services/ContextService"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"

class ExperimentService {
	async runExperiment(options: RunExperimentOptions): Promise<ExperimentResult> {
		const sourceFileWithOriginalMethod = await this.getSourceFileWithOriginalMethod(options.method)

		try {
			const reconstructedMethod = await this.getReconstructMethod(options.method, options.reconstructionOptions)

			const sourceFileWithReconstructedMethod = await this.getSourceFileWithReconstructedMethod(options.method, reconstructedMethod)

			await this.replaceSourceFile(options.method, sourceFileWithReconstructedMethod)

			return {
				reconstructedMethod,
				changedMethodFile: sourceFileWithReconstructedMethod
			}
		} catch (error) {
			ErrorHandlerUtil.handle(error)
			throw error
		} finally {
			await this.replaceSourceFile(options.method, sourceFileWithOriginalMethod)
		}
	}

	private async getReconstructMethod(methodDefinition: MethodDefinition, options: MethodReconstructionOptions): Promise<string> {
		const contextDefinitionWithResolvedRelativePath = ExperimentUtil.resolveContextRelativeFilePath(options.context, methodDefinition.repositoryName)
		const buildedContext = await ContextService.buildContext(contextDefinitionWithResolvedRelativePath)

		const methodTestFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.testRelativeFilePath)
		const methodTestContent = await FileUtil.getFileContent(methodTestFilePath)

		const languageModel = ModelUtil.getLanguageModel(options.model.name)
		const buildedSystemPrompt = PromptService.buildSystemPrompt()
		const buildedUserPrompt = PromptService.buildUserPrompt({
			method: {
				name: methodDefinition.name,
				testContent: methodTestContent
			},
			buildedContext
		})

		const { text: reconstructedMethod } = await generateText({
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
			...(!options.model.reasoning && {
				providerOptions: {
					google: {
						thinkingConfig: {
							thinkingBudget: 0
						}
					}
				}
			})
		})

		return reconstructedMethod
	}

	private async getSourceFileWithReconstructedMethod(methodDefinition: MethodDefinition, reconstructedMethod: string): Promise<string> {
		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

		const sourceFileWithReconstructedMethod = NodeJSCodeParserUtil.replaceSpecificCodeInSourceFile(
			methodFilePath,
			{ kind: "function", name: methodDefinition.name },
			reconstructedMethod
		)

		return sourceFileWithReconstructedMethod
	}

	private async getSourceFileWithOriginalMethod(methodDefinition: MethodDefinition): Promise<string> {
		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

		const sourceFileWithOriginalMethod = await FileUtil.getFileContent(methodFilePath)

		return sourceFileWithOriginalMethod
	}

	private async replaceSourceFile(methodDefinition: MethodDefinition, changedSourceCode: string): Promise<void> {
		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)
		await FileUtil.setFileContent(methodFilePath, changedSourceCode)
	}
}

export default new ExperimentService()
