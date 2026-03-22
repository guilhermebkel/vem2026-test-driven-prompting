import { MethodReconstructionExperimentationOptions } from "@/Protocols/ExperimentationProtocol"
import { ExploredContext } from "@/Protocols/MethodContextExplorerProtocol"
import { ExperimentComparison } from "@/Protocols/MethodReconstructionExperimenterProtocol"

const DEFAULT_EXPERIMENT_COMPARISONS: ExperimentComparison[] = [
	{
		title: "gemini-2.5-flash|temperature-0|relevant-test-case",
		model: { name: "gemini-2.5-flash", reasoningBudget: 0, temperature: 0 },
		context: [{ slug: "relevant-test-case" }]
	},
	{
		title: "gemini-2.5-flash|temperature-0|no-context",
		model: { name: "gemini-2.5-flash", reasoningBudget: 0, temperature: 0 },
		context: []
	}
]

export const METHOD_FILE_PATH_PLACEHOLDER = "<method_file_path>"

export const methodReconstructionExperimentValidation = {
	hasMinimumContextCount: (exploredContext?: ExploredContext): boolean => (
		Number(exploredContext?.context?.length) >= 2
	),
	hasReachedMaximumMethodExperimentedCount: (methodExperimentedCount: number): boolean => (
		methodExperimentedCount >= 2
	)
}

export const methodReconstructionExperimentConfig: MethodReconstructionExperimentationOptions[] = [
	{
		experimentOptions: {
			repositoryName: "date-fns",
			repositoryTestSuiteCommand: "pnpm run test",
			repositorySingleFileTestSuiteCommand: `npx vitest related ${METHOD_FILE_PATH_PLACEHOLDER}`,
			comparisons: DEFAULT_EXPERIMENT_COMPARISONS
		}
	},
	{
		experimentOptions: {
			repositoryName: "directus",
			repositoryTestSuiteCommand: "pnpm --workspace-root test",
			repositorySingleFileTestSuiteCommand: `pnpm -r exec sh -c 'npx vitest related ${METHOD_FILE_PATH_PLACEHOLDER} --run'  `,
			comparisons: DEFAULT_EXPERIMENT_COMPARISONS
		}
	}
]
