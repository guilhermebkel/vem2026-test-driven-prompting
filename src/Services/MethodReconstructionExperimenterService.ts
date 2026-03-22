import {
	ExperimentMethodReconstructionOptions,
	ExperimentMethodReconstructionResult
} from "@/Protocols/MethodReconstructionExperimenterProtocol"
import { ExploreContextResult } from "@/Protocols/MethodContextExplorerProtocol"
import { ContextDefinition } from "@/Protocols/ContextProtocol"
import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import { DeclarationType, ExtractionRule } from "@/Protocols/NodeJSCodeParserProtocol"

import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"
import TracingUtil from "@/Utils/TracingUtil"
import FileUtil from "@/Utils/FileUtil"

import TestExecutorService from "@/Services/TestExecutorService"
import ContextLoaderService from "@/Services/ContextLoaderService"
import PromptBuilderService from "@/Services/PromptBuilderService"
import LLMService from "@/Services/LLMService"
import RepositoryManagerService from "@/Services/RepositoryManagerService"
import LogService from "@/Services/LogService"

import RepositoryTestSuiteFailedError from "@/Errors/RepositoryTestSuiteFailedError"
import { METHOD_FILE_PATH_PLACEHOLDER, methodReconstructionExperimentValidation } from "@/Config/MethodReconstructionExperimentConfig"

class MethodReconstructionExperimenterService {
	async experiment(options: ExperimentMethodReconstructionOptions): Promise<ExperimentMethodReconstructionResult> {
		const exploredMethodResult = await this.getExploredMethodResult(options)
		const exploredContextResult = await this.getExploredContextResult(options)

		const reconstructedMethodExperiments: ExperimentMethodReconstructionResult = []

		let methodExperimentedCount = 0

		for (const exploredMethod of exploredMethodResult) {
			const hasReachedMaximumMethodExperimentedCount = methodReconstructionExperimentValidation.hasReachedMaximumMethodExperimentedCount(methodExperimentedCount)

			if (hasReachedMaximumMethodExperimentedCount) {
				break
			}

			const exploredMethodContext = exploredContextResult.find(({ method }) => (
				method.name === exploredMethod.name
				&& method.declarationType === exploredMethod.declarationType
				&& method.resolvedFilePath === exploredMethod.resolvedMethodFilePath
			))

			const hasMinimumContextCount = methodReconstructionExperimentValidation.hasMinimumContextCount(exploredMethodContext)

			if (!hasMinimumContextCount) {
				continue
			}

			for (const experimentComparison of options.comparisons) {
				const experimentTitle = `${exploredMethod.name} > ${experimentComparison.title}`

				await TracingUtil.traceTask(`Experiment: ${experimentTitle}`, async (config) => {
					const targetContext: ContextDefinition = (exploredMethodContext?.context || [])
						.filter(context => experimentComparison.context.some(({ slug }) => slug === context.slug))
						.map(context => ({
							slug: context.slug,
							type: context.type,
							path: context.resolvedFilePath,
							extractionRule: context.extractionRule as ExtractionRule<DeclarationType>
						}))

					const noTargetContextFoundForExperiment = experimentComparison.context.length > 0 && targetContext.length === 0

					if (noTargetContextFoundForExperiment) {
						config.setOutput("No context was found for this experiment. Skipping...")
					} else {
						const sourceFileWithOriginalMethodBody = await RepositoryManagerService.getSourceFileWithOriginalMethodBody({
							methodResolvedFilePath: exploredMethod.resolvedMethodFilePath,
							repositoryName: options.repositoryName
						})

						try {
							const contextLoadResult = await ContextLoaderService.loadContext({
								context: targetContext,
								method: {
									name: exploredMethod.name as string,
									declarationType: exploredMethod.declarationType as DeclarationType,
									resolvedFilePath: exploredMethod.resolvedMethodFilePath
								},
								repositoryName: options.repositoryName,
								test: {
									resolvedFilePath: exploredMethod.resolvedTestFilePaths[0] as string
								}
							})

							const buildPromptResult = PromptBuilderService.buildPrompt({
								buildedContext: contextLoadResult.buildedContext,
								methodFileContentWithoutMethodBody: contextLoadResult.methodFileContentWithoutMethodBody,
								methodName: exploredMethod.name as string,
								methodTestContent: contextLoadResult.methodTestContent
							})

							const methodReconstructionResult = await LLMService.reconstructMethod({
								model: {
									name: experimentComparison.model.name,
									temperature: experimentComparison.model.temperature,
									reasoningBudget: experimentComparison.model.reasoningBudget
								},
								systemPrompt: buildPromptResult.systemPrompt,
								userPrompt: buildPromptResult.userPrompt
							})

							const sourceFileWithReconstructedMethodBody = await RepositoryManagerService.getSourceFileWithReconstructedMethodBody({
								methodDeclarationType: exploredMethod.declarationType as DeclarationType,
								methodName: exploredMethod.name as string,
								methodResolvedFilePath: exploredMethod.resolvedMethodFilePath,
								repositoryName: options.repositoryName,
								reconstructedMethodBody: methodReconstructionResult.reconstructedMethodBody
							})

							const repositoryTestSuiteResult = await TestExecutorService.runRepositoryTestSuite({
								repositoryName: options.repositoryName,
								repositoryTestSuiteCommand: options.repositorySingleFileTestSuiteCommand.replace(METHOD_FILE_PATH_PLACEHOLDER, exploredMethod.resolvedMethodFilePath)
							})

							if (!repositoryTestSuiteResult.success) {
								config.setError(new RepositoryTestSuiteFailedError())
							}

							reconstructedMethodExperiments.push({
								methodReconstructionResult: {
									methodName: exploredMethod.name as string,
									methodResolvedFilePath: exploredMethod.resolvedMethodFilePath,
									reconstructedMethodBody: methodReconstructionResult.reconstructedMethodBody,
									methodFileContentWithoutMethodBody: contextLoadResult.methodFileContentWithoutMethodBody,
									systemPrompt: buildPromptResult.systemPrompt,
									userPrompt: buildPromptResult.userPrompt,
									reasoningText: methodReconstructionResult.reasoningText
								},
								experimentTitle,
								repositoryTestSuiteResult,
								sourceFileWithReconstructedMethodBody,
								sourceFileWithOriginalMethodBody
							})
						} catch (error) {
							ErrorHandlerUtil.handle(error)
							throw error
						} finally {
							await RepositoryManagerService.revertSourceFileChanges({
								methodResolvedFilePath: exploredMethod.resolvedMethodFilePath,
								repositoryName: options.repositoryName,
								sourceFileWithOriginalMethodBody
							})
						}
					}
				})
			}

			methodExperimentedCount++
		}

		return reconstructedMethodExperiments
	}

	private async getExploredMethodResult(options: ExperimentMethodReconstructionOptions): Promise<ExploreMethodResult> {
		const exploreMethodResult: ExploreMethodResult = await TracingUtil.traceTask("Load method exploration results...", async () => {
			const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
			const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)

			return JSON.parse(methodExplorationResultLogFileContent)
		})

		return exploreMethodResult
	}

	private async getExploredContextResult(options: ExperimentMethodReconstructionOptions): Promise<ExploreContextResult> {
		const exploreMethodResult: ExploreContextResult = await TracingUtil.traceTask("Load method context exploration results...", async () => {
			const methodContextExplorationResultLogFilePath = LogService.getMethodContextExplorationResultLogFilePath(options.repositoryName)
			const methodContextExplorationResultLogFileContent = await FileUtil.getFileContent(methodContextExplorationResultLogFilePath)

			return JSON.parse(methodContextExplorationResultLogFileContent)
		})

		return exploreMethodResult
	}
}

export default new MethodReconstructionExperimenterService()