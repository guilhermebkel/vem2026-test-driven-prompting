import { generateText } from "ai"

import TracingUtil from "@/Utils/TracingUtil"
import ModelUtil from "@/Utils/ModelUtil"

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

			const sanitizedReconstructedMethodBody = this.sanitizeRawReconstructedMethodBody(rawReconstructedMethodBody)

			return {
				reconstructedMethodBody: sanitizedReconstructedMethodBody,
				reasoningText
			}
		})
	}

	private sanitizeRawReconstructedMethodBody(rawReconstructedMethodBody: string): string {
		const sanitizationFunctions: Array<(t: string) => string> = [
			...[
				/**
				 * Strip markdown code block fences (opening and closing).
				 */
				(text: string): string => text.replace(/^```[\w]*\n?/gm, ""),
				(text: string): string => text.replace(/```$/gm, "")
			],
			(text: string): string => text.trim()
		]

		const sanitizedReconstructedMethodBody = sanitizationFunctions.reduce((currentSanitizedText, sanitizationFn) => (
			sanitizationFn(currentSanitizedText)
		), rawReconstructedMethodBody)

		return sanitizedReconstructedMethodBody
	}
}

export default new LLMService()
