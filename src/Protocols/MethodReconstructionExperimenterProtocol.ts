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
		permutationsCount: number
	}
}

export type ExperimentMethodReconstructionOptions = {
	repositoryName: RepositoryName
	repositoryTestSuiteCommand: string
	repositorySingleFileTestSuiteCommand: string
	comparisons: ExperimentComparison[]
}

export type ReconstructedMethodExperiment = {
	methodReconstructionResult: {
		methodName: string
		methodResolvedFilePath: string
		methodFileContentWithoutMethodBody: string
		reconstructedMethodBody: string
		systemPrompt: string
		userPrompt: string
		reasoningText?: string
	}
	experimentTitle: string
	repositoryTestSuiteResult: RepositoryTestSuiteResult
	sourceFileWithReconstructedMethodBody: string
	sourceFileWithOriginalMethodBody: string
}

export type ExperimentMethodReconstructionResult = ReconstructedMethodExperiment[]