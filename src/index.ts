import "dotenv/config"

import { runExperiment } from "@/run-experiment"

async function start(): Promise<void> {
	await runExperiment({
		method: {
			name: "addDays",
			repositoryName: "date-fns",
			testRelativeFilePath: "/src/addDays/test.ts"
		},
		reconstructionOptions: {
			model: {
				name: "gemini-2.5-flash",
				reasoning: false,
				temperature: 0
			},
			context: []
		}
	})
}

start()