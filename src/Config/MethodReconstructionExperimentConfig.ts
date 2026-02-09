import { MethodReconstructionExperimentationOptions } from "@/Protocols/ExperimentationProtocol"
import { ExperimentComparison } from "@/Protocols/MethodReconstructionExperimenterProtocol"

const DEFAULT_EXPERIMENT_COMPARISONS: ExperimentComparison[] = [
	{
		title: "gemini-2.5-flash|temperature-0|same-local-method",
		model: { name: "gemini-2.5-flash", reasoningBudget: 0, temperature: 0 },
		context: [{ slug: "same-class-method" }, { slug: "same-file-function" }]
	},
	{
		title: "gemini-2.5-flash|temperature-0|semantically-similar-method",
		model: { name: "gemini-2.5-flash", reasoningBudget: 0, temperature: 0 },
		context: [{ slug: "semantically-similar-method" }]
	},
	{
		title: "gemini-2.5-flash|temperature-0|structurally-similar-method",
		model: { name: "gemini-2.5-flash", reasoningBudget: 0, temperature: 0 },
		context: [{ slug: "structurally-similar-method" }]
	},
	{
		title: "gemini-2.5-flash|temperature-0|no-context",
		model: { name: "gemini-2.5-flash", reasoningBudget: 0, temperature: 0 },
		context: []
	}
]

export const methodReconstructionExperimentConfig: MethodReconstructionExperimentationOptions[] = [
	{
		experimentOptions: {
			repositoryName: "date-fns",
			repositoryTestSuiteCommand: "pnpm run test",
			comparisons: DEFAULT_EXPERIMENT_COMPARISONS
		}
	},
	{
		experimentOptions: {
			repositoryName: "directus",
			repositoryTestSuiteCommand: "pnpm --workspace-root test",
			comparisons: DEFAULT_EXPERIMENT_COMPARISONS
		}
	},
	{
		experimentOptions: {
			repositoryName: "fastify",
			repositoryTestSuiteCommand: "",
			comparisons: DEFAULT_EXPERIMENT_COMPARISONS
		}
	},
	{
		experimentOptions: {
			repositoryName: "tabnews.com.br",
			repositoryTestSuiteCommand: "",
			comparisons: DEFAULT_EXPERIMENT_COMPARISONS
		}
	}
]
