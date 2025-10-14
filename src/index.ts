import "dotenv/config"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

async function start(): Promise<void> {
	const { text } = await generateText({
		model: google("gemini-2.5-flash"),
		prompt: "What is love?"
	})

	console.log(text)
}

start()