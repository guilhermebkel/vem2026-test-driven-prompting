import { MethodReconstructionExperimentOptions } from "@/Protocols/ExperimentationProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"

type RepositoryExperiment = {
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
	experiments: Array<{
		title: MethodReconstructionExperimentOptions["title"]
		model: MethodReconstructionExperimentOptions["reconstructionOptions"]["model"]
		method: Omit<MethodReconstructionExperimentOptions["method"], "repositoryName" | "repositoryTestSuiteCommand"> & {
			specificTestSuiteCommand?: string
		}
		context: MethodReconstructionExperimentOptions["reconstructionOptions"]["context"]
	}>
}

export const methodReconstructionExperimentConfig: RepositoryExperiment[] = [
	{
		repositoryName: "directus",
		repositoryTestSuiteCommand: "pnpm --workspace-root test",
		experiments: [
			{
				title: "storage-driver-gcs:write",
				model: {
					name: "gemini-2.5-flash",
					reasoningBudget: 0,
					temperature: 0
				},
				method: {
					name: "write",
					declarationType: "method",
					specificTestSuiteCommand: "pnpm --filter storage-driver-gcs test",
					testRelativeFilePath: "/packages/storage-driver-gcs/src/index.test.ts",
					methodRelativeFilePath: "/packages/storage-driver-gcs/src/index.ts"
				},
				context: []
			}
		]
	}
]
