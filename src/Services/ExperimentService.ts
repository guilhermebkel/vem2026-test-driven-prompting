import { generateText } from "ai"

import { ExperimentResult, MethodDefinition, MethodReconstructionOptions, RunExperimentOptions } from "@/Protocols/ExperimentProtocol"

import ModelUtil from "@/Utils/ModelUtil"
import FileUtil from "@/Utils/FileUtil"
import ExperimentUtil from "@/Utils/ExperimentUtil"

import PromptService from "@/Services/PromptService"
import ContextService from "@/Services/ContextService"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"

class ExperimentService {
	async runExperiment(options: RunExperimentOptions): Promise<ExperimentResult> {
		const reconstructedMethod = await this.reconstructMethod(options.method, options.reconstructionOptions)

		const changedMethodFile = await this.replaceOriginalMethod(options.method, reconstructedMethod)

		return {
			reconstructedMethod,
			changedMethodFile
		}
	}

	private async reconstructMethod(methodDefinition: MethodDefinition, options: MethodReconstructionOptions): Promise<string> {
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

	private async replaceOriginalMethod(methodDefinition: MethodDefinition, reconstructedMethod: string): Promise<string> {
		const methodFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.methodRelativeFilePath)

		const sourceCodeWithChanges = NodeJSCodeParserUtil.replaceSpecificCode(
			methodFilePath,
			{ kind: "function", name: methodDefinition.name },
			reconstructedMethod
		)

		return sourceCodeWithChanges
	}
}

export default new ExperimentService()
