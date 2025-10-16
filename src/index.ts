import "dotenv/config"

import ExperimentService from "@/Services/ExperimentService"

async function start(): Promise<void> {
	const result = await ExperimentService.runExperiment({
		method: {
			name: "addDays",
			repositoryName: "date-fns",
			testRelativeFilePath: "/src/addDays/test.ts",
			methodRelativeFilePath: "/src/addDays/index.ts"
		},
		reconstructionOptions: {
			model: {
				name: "gemini-2.5-flash",
				reasoning: false,
				temperature: 0
			},
			context: [
				{
					type: "local",
					slug: "typing",
					path: "/src/types.ts"
				}
			]
		}
	})

	console.log(result)
}

start()