import { generateText } from "ai"

import TracingUtil from "@/Utils/TracingUtil"
import ModelUtil from "@/Utils/ModelUtil"
import SanitizationUtil from "@/Utils/SanitizationUtil"

import { MethodReconstructionOptions, MethodReconstructionResult } from "@/Protocols/LLMProtocol"

class LLMService {
	async reconstructMethod(options: MethodReconstructionOptions): Promise<MethodReconstructionResult> {
		return await TracingUtil.traceAction("Reconstructing method body with LLM...", async () => {
			const languageModel = ModelUtil.getLanguageModel(options.model.name)

			const { text: rawReconstructedMethodBody, reasoningText } = await generateText({
				model: languageModel,
				abortSignal: AbortSignal.timeout(180_000),
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
					...ModelUtil.getDefaultReasoningProviderOptions(options.model.name)
				}
			})

			const sanitizedReconstructedMethodBody = SanitizationUtil.sanitizeRawReconstructedMethodBody(rawReconstructedMethodBody)

			return {
				reconstructedMethodBody: sanitizedReconstructedMethodBody,
				reasoningText
			}
		})
	}
}

export default new LLMService()
