import { LanguageModelName } from "@/Protocols/ModelProtocol"
import { ContextDefinitionItem } from "@/Protocols/ContextProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { RepositoryTestSuiteResult } from "@/Protocols/TestExecutorProtocol"

export type ExperimentComparison = {
	title: string
	model: {
		name: LanguageModelName
		reasoningBudget: number
		temperature: number
	}
	context: {
		definitions: Array<{ slug: ContextDefinitionItem["slug"] }>
		isPermutationEnabled: boolean
	}
}

export type ExperimentMethodReconstructionOptions = {
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
	repositorySingleFileTestSuiteCommand: string
	comparisons: ExperimentComparison[]
}

export type ReconstructedMethodExperiment = {
	experiment: {
		input: {
			experimentTitle: string
			methodName: string
			methodResolvedFilePath: string
			contextDefinitions: ExperimentComparison["context"]["definitions"]
		}
		output: {
			repositoryTestSuiteResult: RepositoryTestSuiteResult
			sourceFileWithReconstructedMethodBody: string
			sourceFileWithOriginalMethodBody: string
			methodFileContentWithoutMethodBody: string
		}
	}
	model: {
		input: {
			name: LanguageModelName
			reasoningBudget: number
			temperature: number
			systemPrompt: string
			userPrompt: string
		}
		output: {
			result: string
			reasoningText?: string
		}
	}
	metrics: {
		isTestSuiteSuccessful: boolean
		isModelResultCompilable: boolean
		relevantTestCaseCount: number
		testSuiteTotalTestCaseCount: number
		testSuitePassedTestCaseCount: number
		testSuiteFailedTestCaseCount: number
	}
}

export type ExperimentMethodReconstructionResult = ReconstructedMethodExperiment[]