import "dotenv/config"

import ExperimentService from "@/Services/ExperimentService"

import TracingUtil from "@/Utils/TracingUtil"

import { ExperimentOptions, RepositoryName } from "@/Protocols/ExperimentProtocol"

import RepositoryTestSuiteFailedError from "@/Errors/RepositoryTestSuiteFailedError"

type RepositoryExperiment = {
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
	experiments: Array<{
		title: ExperimentOptions["title"]
		model: ExperimentOptions["reconstructionOptions"]["model"]
		method: Omit<ExperimentOptions["method"], "repositoryName" | "repositoryTestSuiteCommand"> & {
			specificTestSuiteCommand?: string
		}
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
				model: {
					name: "gemini-2.5-flash",
					reasoningBudget: 0,
					temperature: 0
				},
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
				model: {
					name: "gemini-2.5-flash",
					reasoningBudget: 0,
					temperature: 0
				},
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
			},
			{
				title: "addDays_withoutContext",
				method: {
					name: "addDays",
					declarationType: "function",
					testRelativeFilePath: "/src/addDays/test.ts",
					methodRelativeFilePath: "/src/addDays/index.ts"
				},
				model: {
					name: "gemini-2.5-flash",
					reasoningBudget: 0,
					temperature: 0
				},
				context: []
			},
			{
				title: "addDays_withSimilarMethodContext",
				method: {
					name: "addDays",
					declarationType: "function",
					testRelativeFilePath: "/src/addDays/test.ts",
					methodRelativeFilePath: "/src/addDays/index.ts"
				},
				model: {
					name: "gemini-2.5-flash",
					reasoningBudget: 0,
					temperature: 0
				},
				context: [
					{
						type: "semantic",
						slug: "similar-method",
						path: "/src/addMonths/index.ts"
					}
				]
			},
			{
				title: "addDays_withImportedDependenciesAndLastFailedTestContextAndReasoningModel",
				method: {
					name: "addDays",
					declarationType: "function",
					testRelativeFilePath: "/src/addDays/test.ts",
					methodRelativeFilePath: "/src/addDays/index.ts"
				},
				model: {
					name: "gemini-2.5-pro",
					reasoningBudget: 1000,
					temperature: 0
				},
				context: [
					{
						type: "semantic",
						slug: "imported-dependency",
						path: "/src/constructFrom/index.ts"
					},
					{
						type: "semantic",
						slug: "imported-dependency",
						path: "/src/toDate/index.ts"
					},
					{
						type: "semantic",
						slug: "last-test-run-error-log",
						content: `
							⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

							FAIL  src/addDays/test.ts > addDays > doesn't mutate if zero increment is used: America/Sao_Paulo
							AssertionError: expected 2017-02-19T01:00:00.000Z to deeply equal 2017-02-19T02:00:00.000Z

							[32m- Expected[39m
							[31m+ Received[39m

							[32m- 2017-02-19T02:00:00.000Z[39m
							[31m+ 2017-02-19T01:00:00.000Z[39m

							❯ src/addDays/test.ts:114:22
									112|       const date = new Date(dstTransitions.end!);
									113|       const result = addDays(date, 0);
									114|       expect(result).toEqual(date);
										|                      ^
									115|     },
									116|   );

							⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
						`
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
				title: "memory-bus-local:publish_withoutContext",
				model: {
					name: "gemini-2.5-flash",
					reasoningBudget: 0,
					temperature: 0
				},
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
				title: "storage-driver-supabase:getClient_withoutContext",
				model: {
					name: "gemini-2.5-flash",
					reasoningBudget: 0,
					temperature: 0
				},
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
		await TracingUtil.traceTask(`Repository: ${repositoryExperiment.repositoryName}`, async () => {
			for (const experiment of repositoryExperiment.experiments) {
				await TracingUtil.traceTask(`Experiment: ${experiment.title}`, async (config) => {
					const result = await ExperimentService.runExperiment({
						title: experiment.title,
						method: {
							...experiment.method,
							repositoryName: repositoryExperiment.repositoryName,
							repositoryTestSuiteCommand: experiment.method?.specificTestSuiteCommand || repositoryExperiment.repositoryTestSuiteCommand
						},
						reconstructionOptions: {
							model: experiment.model,
							context: experiment.context
						}
					})

					if (!result.repositoryTestSuiteResult.success) {
						config.setError(new RepositoryTestSuiteFailedError())
					}
				})
			}
		})
	}
}

start()