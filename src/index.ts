import "dotenv/config"

import ExperimentService from "@/Services/ExperimentService"
import FileUtil from "./Utils/FileUtil"

async function start(): Promise<void> {
	const result = await ExperimentService.runExperiment({
		method: {
			name: "addDays",
			repositoryName: "date-fns",
			repositoryTestSuiteCommand: "pnpm run test",
			testRelativeFilePath: "/src/addDays/test.ts",
			methodRelativeFilePath: "/src/addDays/index.ts"
		},
		reconstructionOptions: {
			model: {
				name: "gemini-2.5-flash",
				reasoningBudget: 0,
				temperature: 0
			},
			context: [
				{
					type: "local",
					slug: "typing",
					path: "/src/types.ts"
				},
				{
					type: "semantic",
					slug: "dependent-method",
					path: "src/subDays/index.ts"
				},
				{
					type: "semantic",
					slug: "dependent-test",
					path: "src/subDays/test.ts"
				},
				{
					type: "semantic",
					slug: "dependent-test",
					path: "src/setISODay/test.ts"
				}
			]
		}
	})

	// await FileUtil.setFileContent("./result.txt", result.repositoryTestSuiteResult.failureMessage!)
}

start()