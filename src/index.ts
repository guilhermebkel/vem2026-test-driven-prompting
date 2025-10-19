import "dotenv/config"

import ExperimentService from "@/Services/ExperimentService"

import { ExperimentOptions, RepositoryName } from "@/Protocols/ExperimentProtocol"

type RepositoryExperiment = {
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
	experiments: Array<{
		title: ExperimentOptions["title"]
		method: Omit<ExperimentOptions["method"], "repositoryName" | "repositoryTestSuiteCommand"> & {
			specificTestSuiteCommand?: string
		}
		context: ExperimentOptions["reconstructionOptions"]["context"]
	}>
}

const REPOSITORY_EXPERIMENTS: RepositoryExperiment[] = [
	// {
	// 	repositoryName: "date-fns",
	// 	repositoryTestSuiteCommand: "pnpm run test",
	// 	experiments: [
	// 		{
	// 			title: "endOfQuarter:index_withoutContext",
	// 			method: {
	// 				name: "endOfQuarter",
	// 				declarationType: "function",
	// 				testRelativeFilePath: "/src/endOfQuarter/test.ts",
	// 				methodRelativeFilePath: "/src/endOfQuarter/index.ts"
	// 			},
	// 			context: []
	// 		},
	// 		{
	// 			title: "endOfQuarter:index_withSimilarMethodContext",
	// 			method: {
	// 				name: "endOfQuarter",
	// 				declarationType: "function",
	// 				testRelativeFilePath: "/src/endOfQuarter/test.ts",
	// 				methodRelativeFilePath: "/src/endOfQuarter/index.ts"
	// 			},
	// 			context: [
	// 				{
	// 					type: "semantic",
	// 					slug: "similar-method",
	// 					path: "/src/endOfMonth/index.ts"
	// 				}
	// 			]
	// 		}
	// 	]
	// },
	{
		repositoryName: "directus",
		repositoryTestSuiteCommand: "pnpm --workspace-root test",
		experiments: [
			{
				title: "memory:bus:local:publish:local_withoutContext",
				method: {
					name: "publish",
					declarationType: "method",
					specificTestSuiteCommand: "pnpm --filter memory test",
					testRelativeFilePath: "/packages/memory/src/bus/lib/local.test.ts",
					methodRelativeFilePath: "/packages/memory/src/bus/lib/local.ts"
				},
				context: []
			},
			{
				title: "storage-driver-supabase:index:publish_withoutContext",
				method: {
					name: "getClient",
					declarationType: "method",
					specificTestSuiteCommand: "pnpm --filter storage-driver-supabase test",
					testRelativeFilePath: "/packages/storage-driver-supabase/src/index.test.ts",
					methodRelativeFilePath: "/packages/storage-driver-supabase/src/index.ts"
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
					repositoryTestSuiteCommand: experiment.method?.specificTestSuiteCommand || repositoryExperiment.repositoryTestSuiteCommand
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

			console.log(`=> Experiment [${experiment.title}] result: ${result.repositoryTestSuiteResult.success ? "SUCCESS" : "FAILURE"}!`)
		}
	}
}

start()