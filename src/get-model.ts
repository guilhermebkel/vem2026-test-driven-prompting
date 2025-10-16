import { google } from "@ai-sdk/google"
import { LanguageModel } from "ai"

export type ModelName = "gemini-2.5-flash"

export const getModel = (modelName: ModelName): LanguageModel => {
	const modelNameToModel: Record<ModelName, LanguageModel> = {
		"gemini-2.5-flash": google("gemini-2.5-flash")
	}

	return modelNameToModel[modelName]
}