import { generateText } from "ai"

import { MethodDefinition, MethodReconstructionOptions, RunExperimentOptions } from "@/Protocols/ExperimentProtocol"

import ModelUtil from "@/Utils/ModelUtil"
import FileUtil from "@/Utils/FileUtil"
import ExperimentUtil from "@/Utils/ExperimentUtil"

import PromptService from "@/Services/PromptService"
import ContextService from "@/Services/ContextService"

class ExperimentService {
	async runExperiment(options: RunExperimentOptions): Promise<void> {
		const reconstructedMethod = await this.reconstructMethod(options.method, options.reconstructionOptions)

		console.log(reconstructedMethod)
	}

	private async reconstructMethod(methodDefinition: MethodDefinition, options: MethodReconstructionOptions): Promise<string> {
		const contextDefinitionWithResolvedRelativePath = ExperimentUtil.resolveContextRelativeFilePath(options.context, methodDefinition.repositoryName)
		const buildedContext = await ContextService.buildContext(contextDefinitionWithResolvedRelativePath)

		const methodTestFilePath = ExperimentUtil.resolveRelativeFilePath(methodDefinition.repositoryName, methodDefinition.testRelativeFilePath)
		const methodTestContent = await FileUtil.getFileContent(methodTestFilePath)

		const model = ModelUtil.getLanguageModel(options.model.name)
		const systemPrompt = PromptService.buildSystemPrompt()
		const userPrompt = PromptService.buildUserPrompt({
			method: {
				name: methodDefinition.name,
				testContent: methodTestContent
			},
			buildedContext
		})

		const { text: reconstructedMethodInString } = await generateText({
			model,
			messages: [
				{
					role: "system",
					content: systemPrompt
				},
				{
					role: "user",
					content: userPrompt
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

		return reconstructedMethodInString
	}
}

export default new ExperimentService()
