import "dotenv/config"

import ExperimentService from "@/Services/ExperimentService"

async function start(): Promise<void> {
	const { reconstructedMethod } = await ExperimentService.runExperiment({
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
			context: [
				{
					type: "global",
					slug: "project-metadata",
					path: "/package.json"
				}
			]
		}
	})

	console.log(reconstructedMethod)
}

start()