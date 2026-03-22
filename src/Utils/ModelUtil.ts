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
}

export default new ModelUtil()
