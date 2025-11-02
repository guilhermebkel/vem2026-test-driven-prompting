import TracingUtil from "@/Utils/TracingUtil"

import { MethodReconstructionOptions, MethodReconstructionResult } from "@/Protocols/MethodReconstructorProtocol"
import ModelUtil from "@/Utils/ModelUtil"
import { generateText } from "ai"

class LLMService {
	async reconstructMethod(options: MethodReconstructionOptions): Promise<MethodReconstructionResult> {
		return await TracingUtil.traceAction("Reconstructing method body with LLM...", async () => {
			const languageModel = ModelUtil.getLanguageModel(options.model.name)

			const { text: reconstructedMethodBody, reasoningText } = await generateText({
				model: languageModel,
				messages: [
					{
						role: "system",
						content: options.systemPrompt
					},
					{
						role: "user",
						content: options.userPrompt
					}
				],
				temperature: options.model.temperature,
				providerOptions: {
					google: {
						thinkingConfig: {
							thinkingBudget: options.model.reasoningBudget,
							includeThoughts: options.model.reasoningBudget > 0
						}
					}
				}
			})

			return {
				reconstructedMethodBody,
				reasoningText
			}
		})
	}
}

export default new LLMService()
