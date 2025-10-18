import "dotenv/config"

import ExperimentService from "@/Services/ExperimentService"

async function start(): Promise<void> {
	const METHOD_NAME = "addBusinessDays"

	const result = await ExperimentService.runExperiment({
		method: {
			name: METHOD_NAME,
			declarationType: "function",
			repositoryName: "date-fns",
			repositoryTestSuiteCommand: "pnpm run test",
			testRelativeFilePath: `/src/${METHOD_NAME}/test.ts`,
			methodRelativeFilePath: `/src/${METHOD_NAME}/index.ts`
		},
		reconstructionOptions: {
			model: {
				name: "gemini-2.5-flash",
				reasoningBudget: 0,
				temperature: 0
			},
			context: []
		}
	})

	console.log({ success: result.repositoryTestSuiteResult.success })
}

start()