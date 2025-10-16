import { generateText } from "ai"

import { buildContext, ContextDefinitionItem } from "@/build-context"
import { buildUserPrompt, buildSystemPrompt } from "@/build-prompt"
import { getModel, ModelName } from "@/get-model"
import { getExperimentRepoFilePath } from "@/get-experiment-repo-file-path"
import { MethodDefinition } from "@/run-experiment"
import { getFileContent } from "@/get-file-content"

export type MethodReconstructionOptions = {
	context: ContextDefinitionItem[]
	model: {
		name: ModelName
		reasoning: boolean
		temperature: number
	}
}

export const reconstructMethod = async (methodDefinition: MethodDefinition, options: MethodReconstructionOptions): Promise<string> => {
	const contextWithPaths: ContextDefinitionItem[] = options.context.map((contextItem) => {
		return {
			...contextItem,
			...(contextItem.path && { path: getExperimentRepoFilePath(methodDefinition.repositoryName, contextItem.path) })
		} as ContextDefinitionItem
	})

	const buildedContext = await buildContext(contextWithPaths)

	const methodTestFilePath = getExperimentRepoFilePath(methodDefinition.repositoryName, methodDefinition.testRelativeFilePath)
	const methodTestContent = await getFileContent(methodTestFilePath)

	const systemPrompt = buildSystemPrompt({ methodName: methodDefinition.name, methodTestContent })
	const userPrompt = buildUserPrompt(buildedContext)
	const model = getModel(options.model.name)

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