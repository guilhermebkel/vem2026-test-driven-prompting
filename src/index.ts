import "dotenv/config"

import ExperimentService from "@/Services/ExperimentService"

import { ExperimentOptions, RepositoryName } from "@/Protocols/ExperimentProtocol"

type RepositoryExperiment = {
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
	experiments: Array<{
		title: ExperimentOptions["title"]
		method: Omit<ExperimentOptions["method"], "repositoryName" | "repositoryTestSuiteCommand">
		context: ExperimentOptions["reconstructionOptions"]["context"]
	}>
}

const REPOSITORY_EXPERIMENTS: RepositoryExperiment[] = [
	{
		repositoryName: "date-fns",
		repositoryTestSuiteCommand: "pnpm run test",
		experiments: [
			{
				title: "endOfQuarter_withoutContext",
				method: {
					name: "endOfQuarter",
					declarationType: "function",
					testRelativeFilePath: "/src/endOfQuarter/test.ts",
					methodRelativeFilePath: "/src/endOfQuarter/index.ts"
				},
				context: []
			},
			{
				title: "endOfQuarter_withSimilarMethodContext",
				method: {
					name: "endOfQuarter",
					declarationType: "function",
					testRelativeFilePath: "/src/endOfQuarter/test.ts",
					methodRelativeFilePath: "/src/endOfQuarter/index.ts"
				},
				context: [
					{
						type: "semantic",
						slug: "similar-method",
						path: "/src/endOfMonth/index.ts"
					}
				]
			}
		]
	},
	{
		repositoryName: "directus",
		repositoryTestSuiteCommand: "pnpm --workspace-root test",
		experiments: [
			{
				title: "min-max-point_withoutContext",
				method: {
					name: "minMaxPoint",
					declarationType: "function",
					testRelativeFilePath: "/app/src/modules/settings/routes/flows/components/arrows/utils/min-max-point.test.ts",
					methodRelativeFilePath: "/app/src/modules/settings/routes/flows/components/arrows/utils/min-max-point.ts"
				},
				context: []
			}
		]
	}
]

async function start(): Promise<void> {
	for (const repositoryExperiment of REPOSITORY_EXPERIMENTS) {
		console.log("\n=> Running experiments for repository: ", repositoryExperiment.repositoryName)

		for (const experiment of repositoryExperiment.experiments) {
			console.log(`=> Experiment [${experiment.title}] is running... `)

			const result = await ExperimentService.runExperiment({
				title: experiment.title,
				method: {
					...experiment.method,
					repositoryName: repositoryExperiment.repositoryName,
					repositoryTestSuiteCommand: repositoryExperiment.repositoryTestSuiteCommand
				},
				reconstructionOptions: {
					model: {
						name: "gemini-2.5-flash",
						reasoningBudget: 0,
						temperature: 0
					},
					context: experiment.context
				}
			})

			console.log(`=> Experiment [${experiment.title}] resulted in: ${result.repositoryTestSuiteResult.success ? "SUCCESS" : "FAILURE"}!`)
		}
	}
}

start()