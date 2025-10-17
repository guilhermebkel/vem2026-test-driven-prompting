import { google } from "@ai-sdk/google"
import { LanguageModel } from "ai"

import { LanguageModelName } from "@/Protocols/ModelProtocol"

class ModelUtil {
	getLanguageModel(modelName: LanguageModelName): LanguageModel {
		const languageModelNameToLanguageModel: Record<LanguageModelName, LanguageModel> = {
			"gemini-2.5-flash": google("gemini-2.5-flash"),
			"gemini-2.5-pro": google("gemini-2.5-pro")
		}

		return languageModelNameToLanguageModel[modelName]
	}
}

export default new ModelUtil()
