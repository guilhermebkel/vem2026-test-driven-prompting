import { MethodReconstructionExperimentationOptions } from "@/Protocols/ExperimentationProtocol"
import { ExploredContext } from "@/Protocols/MethodContextExplorerProtocol"
import { ExperimentComparison } from "@/Protocols/MethodReconstructionExperimenterProtocol"

const DEFAULT_EXPERIMENT_COMPARISONS: ExperimentComparison[] = [
	{
		title: "all-relevant-test-case",
		model: { name: "gemini-2.5-flash", temperature: 0 },
		context: { definitions: [{ slug: "relevant-test-case" }], isPermutationEnabled: false }
	},
	{
		title: "permuted-relevant-test-case",
		model: { name: "gemini-2.5-flash", temperature: 0 },
		context: { definitions: [{ slug: "relevant-test-case" }], isPermutationEnabled: true }
	},
	{
		title: "no-relevant-test-case",
		model: { name: "gemini-2.5-flash", temperature: 0 },
		context: { definitions: [], isPermutationEnabled: false }
	},
	{
		title: "all-relevant-test-case",
		model: { name: "gemini-3.0-flash", temperature: 0 },
		context: { definitions: [{ slug: "relevant-test-case" }], isPermutationEnabled: false }
	},
	{
		title: "permuted-relevant-test-case",
		model: { name: "gemini-3.0-flash", temperature: 0 },
		context: { definitions: [{ slug: "relevant-test-case" }], isPermutationEnabled: true }
	},
	{
		title: "no-relevant-test-case",
		model: { name: "gemini-3.0-flash", temperature: 0 },
		context: { definitions: [], isPermutationEnabled: false }
	}
]

export const METHOD_CONTENT_FILE_PATH_PLACEHOLDER = "<method_content_file_path>"
export const METHOD_TEST_FILE_PATH_PLACEHOLDER = "<method_test_file_path>"

export const methodReconstructionExperimentValidation = {
	hasMinimumContextCount: (exploredContext?: ExploredContext): boolean => (
		Number(exploredContext?.context?.length) >= 2
	),
	hasReachedMaximumMethodExperimentedCount: (methodExperimentedCount: number): boolean => (
		methodExperimentedCount >= Infinity
	)
}

export const methodReconstructionExperimentConfig: MethodReconstructionExperimentationOptions[] = [
	{
		experimentOptions: {
			repositoryName: "date-fns",
			repositoryTestSuiteCommand: "pnpm run test",
			repositorySingleFileTestSuiteCommand: `npx vitest ${METHOD_TEST_FILE_PATH_PLACEHOLDER} --run`,
			comparisons: DEFAULT_EXPERIMENT_COMPARISONS
		}
	},
	{
		experimentOptions: {
			repositoryName: "directus",
			repositoryTestSuiteCommand: "pnpm --workspace-root test",
			repositorySingleFileTestSuiteCommand: `sh -c 'root="${METHOD_TEST_FILE_PATH_PLACEHOLDER}"; while [ ! -f "$root/vitest.config.ts" ] && [ ! -f "$root/vitest.config.js" ] && [ "$root" != "/" ]; do root=$(dirname "$root"); done; cd "$root" && npx vitest "${METHOD_TEST_FILE_PATH_PLACEHOLDER}" --run'`,
			comparisons: DEFAULT_EXPERIMENT_COMPARISONS
		}
	}
]
