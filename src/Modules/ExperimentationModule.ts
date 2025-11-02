import {
	MethodReconstructionExperimentOptions,
	MethodReconstructionExperimentResult
} from "@/Protocols/ExperimentationProtocol"

import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"

import TestExecutorService from "@/Services/TestExecutorService"
import ContextLoaderService from "@/Services/ContextLoaderService"
import PromptBuilderService from "@/Services/PromptBuilderService"
import LLMService from "@/Services/LLMService"
import LogService from "@/Services/LogService"
import RepositoryManagerService from "@/Services/RepositoryManagerService"

class ExperimentationModule {
	async runMethodReconstructionExperiment(options: MethodReconstructionExperimentOptions): Promise<MethodReconstructionExperimentResult> {
		const sourceFileWithOriginalMethodBody = await RepositoryManagerService.getSourceFileWithOriginalMethodBody({
			methodRelativeFilePath: options.method.methodRelativeFilePath,
			repositoryName: options.method.repositoryName
		})

		try {
			const contextLoadResult = await ContextLoaderService.loadContext({
				context: options.reconstructionOptions.context,
				method: {
					name: options.method.name,
					declarationType: options.method.declarationType,
					relativeFilePath: options.method.methodRelativeFilePath
				},
				repositoryName: options.method.repositoryName,
				test: {
					relativeFilePath: options.method.testRelativeFilePath
				}
			})

			const buildPromptResult = PromptBuilderService.buildPrompt({
				buildedContext: contextLoadResult.buildedContext,
				methodFileContentWithoutMethodBody: contextLoadResult.methodFileContentWithoutMethodBody,
				methodName: options.method.name,
				methodTestContent: contextLoadResult.methodTestContent
			})

			const methodReconstructionResult = await LLMService.reconstructMethod({
				model: {
					name: options.reconstructionOptions.model.name,
					temperature: options.reconstructionOptions.model.temperature,
					reasoningBudget: options.reconstructionOptions.model.reasoningBudget
				},
				systemPrompt: buildPromptResult.systemPrompt,
				userPrompt: buildPromptResult.userPrompt
			})

			const sourceFileWithReconstructedMethodBody = await RepositoryManagerService.getSourceFileWithReconstructedMethodBody({
				methodDeclarationType: options.method.declarationType,
				methodName: options.method.name,
				methodRelativeFilePath: options.method.methodRelativeFilePath,
				repositoryName: options.method.repositoryName,
				reconstructedMethodBody: methodReconstructionResult.reconstructedMethodBody
			})

			const repositoryTestSuiteResult = await TestExecutorService.runRepositoryTestSuite(options.method)

			const experimentResult: MethodReconstructionExperimentResult = {
				methodReconstructionResult: {
					reconstructedMethodBody: methodReconstructionResult.reconstructedMethodBody,
					methodFileContentWithoutMethodBody: contextLoadResult.methodFileContentWithoutMethodBody,
					systemPrompt: buildPromptResult.systemPrompt,
					userPrompt: buildPromptResult.userPrompt,
					reasoningText: methodReconstructionResult.reasoningText
				},
				repositoryTestSuiteResult,
				sourceFileWithReconstructedMethodBody,
				sourceFileWithOriginalMethodBody
			}

			await LogService.saveMethodReconstructionExperimentLogs(options, experimentResult)

			return experimentResult
		} catch (error) {
			ErrorHandlerUtil.handle(error)
			throw error
		} finally {
			await RepositoryManagerService.revertSourceFileChanges({
				methodRelativeFilePath: options.method.methodRelativeFilePath,
				repositoryName: options.method.repositoryName,
				sourceFileWithOriginalMethodBody
			})
		}
	}
}

export default new ExperimentationModule()
