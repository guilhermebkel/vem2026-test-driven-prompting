import { google } from "@ai-sdk/google"
import { LanguageModel } from "ai"

import { LanguageModelName } from "@/Protocols/ModelProtocol"

class ModelUtil {
	getLanguageModel(modelName: LanguageModelName): LanguageModel {
		const languageModelNameToLanguageModel: Record<LanguageModelName, LanguageModel> = {
			"gemini-2.5-flash": google("gemini-2.5-flash"),
			"gemini-2.5-pro": google("gemini-2.5-pro"),
			"gemini-3.0-flash": google("gemini-3-flash-preview"),
			"gemini-3.0-pro": google("gemini-3-pro-preview")
		}

		return languageModelNameToLanguageModel[modelName]
	}

	getDefaultReasoningProviderOptions(modelName: LanguageModelName): object {
		const languageModelNameToDefaultReasoningProviderOptions: Record<LanguageModelName, object> = {
			"gemini-2.5-flash": {
				google: {
					thinkingConfig: {
						thinkingBudget: 0,
						includeThoughts: false
					}
				}
			},
			"gemini-2.5-pro": {
				google: {
					thinkingConfig: {
						thinkingBudget: 2000,
						includeThoughts: true
					}
				}
			},
			"gemini-3.0-flash": {
				google: {
					thinkingConfig: {
						thinkingLevel: "low",
						includeThoughts: true
					}
				}
			},
			"gemini-3.0-pro": {
				google: {
					thinkingConfig: {
						thinkingLevel: "low",
						includeThoughts: true
					}
				}
			}
		}

		return languageModelNameToDefaultReasoningProviderOptions[modelName] || {}
	}
}

export default new ModelUtil()
