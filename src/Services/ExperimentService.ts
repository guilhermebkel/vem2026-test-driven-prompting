import { generateText } from "ai"
import path from "path"

import { MethodDefinition, MethodReconstructionOptions, RepositoryName, RunExperimentOptions } from "@/Protocols/ExperimentProtocol"
import { ContextDefinitionItem } from "@/Protocols/ContextProtocol"

import ModelUtil from "@/Utils/ModelUtil"
import FileUtil from "@/Utils/FileUtil"

import PromptService from "@/Services/PromptService"
import ContextService from "@/Services/ContextService"

class ExperimentService {
	async runExperiment(options: RunExperimentOptions): Promise<void> {
		const reconstructedMethod = await this.reconstructMethod(options.method, options.reconstructionOptions)

		console.log(reconstructedMethod)
	}

	private async reconstructMethod(methodDefinition: MethodDefinition, options: MethodReconstructionOptions): Promise<string> {
		const contextWithPaths: ContextDefinitionItem[] = options.context.map((contextItem) => {
			return {
				...contextItem,
				...(contextItem.path && { path: this.getExperimentRepoFilePath(methodDefinition.repositoryName, contextItem.path) })
			} as ContextDefinitionItem
		})

		const buildedContext = await ContextService.buildContext(contextWithPaths)

		const methodTestFilePath = this.getExperimentRepoFilePath(methodDefinition.repositoryName, methodDefinition.testRelativeFilePath)
		const methodTestContent = await FileUtil.getFileContent(methodTestFilePath)

		const systemPrompt = PromptService.buildSystemPrompt({ methodName: methodDefinition.name, methodTestContent })
		const userPrompt = PromptService.buildUserPrompt(buildedContext)
		const model = ModelUtil.getLanguageModel(options.model.name)

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

	private getExperimentRepoFilePath(experimentRepo: RepositoryName, filePath: string): string {
		const rootDirectoryPath = process.cwd()
		const experimentRepoFilePath = path.join(rootDirectoryPath, "experiment-repos", experimentRepo, filePath)

		return experimentRepoFilePath
	}
}

export default new ExperimentService()
