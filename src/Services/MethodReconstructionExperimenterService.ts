import {
	ExperimentComparison,
	ExperimentMethodReconstructionOptions,
	ExperimentMethodReconstructionResult,
	ReconstructedMethodExperiment
} from "@/Protocols/MethodReconstructionExperimenterProtocol"
import { ExploreContextResult } from "@/Protocols/MethodContextExplorerProtocol"
import { ContextDefinition } from "@/Protocols/ContextProtocol"
import { ExploredMethod, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import { DeclarationType, ExtractionRule } from "@/Protocols/NodeJSCodeParserProtocol"

import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"
import TracingUtil from "@/Utils/TracingUtil"
import FileUtil from "@/Utils/FileUtil"
import ArrayUtil from "@/Utils/ArrayUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import TestResultHandlerUtil from "@/Utils/TestResultHandlerUtil"

import TestExecutorService from "@/Services/TestExecutorService"
import ContextLoaderService from "@/Services/ContextLoaderService"
import PromptBuilderService from "@/Services/PromptBuilderService"
import LLMService from "@/Services/LLMService"
import RepositoryManagerService from "@/Services/RepositoryManagerService"
import LogService from "@/Services/LogService"

import RepositoryTestSuiteFailedError from "@/Errors/RepositoryTestSuiteFailedError"

import { METHOD_FILE_PATH_PLACEHOLDER, methodReconstructionExperimentValidation } from "@/Config/MethodReconstructionExperimentConfig"

class MethodReconstructionExperimenterService {
	async experiment(
		options: ExperimentMethodReconstructionOptions,
		onSingleExperimentExecuted: (result: ReconstructedMethodExperiment) => Promise<void>
	): Promise<ExperimentMethodReconstructionResult> {
		const exploredMethodResult = await this.getExploredMethodResult(options)
		const exploredContextResult = await this.getExploredContextResult(options)

		const reconstructedMethodExperiments: ExperimentMethodReconstructionResult = []

		let methodExperimentedCount = 0

		await DataProcessUtil.process({
			batchSize: 1,
			items: exploredMethodResult,
			handlerFn: async (exploredMethod) => {
				const hasReachedMaximumMethodExperimentedCount = methodReconstructionExperimentValidation.hasReachedMaximumMethodExperimentedCount(methodExperimentedCount)

				if (hasReachedMaximumMethodExperimentedCount) {
					return
				}

				const exploredMethodContext = exploredContextResult.find(({ method }) => (
					method.name === exploredMethod.name
					&& method.declarationType === exploredMethod.declarationType
					&& method.resolvedFilePath === exploredMethod.resolvedMethodFilePath
				))

				const hasMinimumContextCount = methodReconstructionExperimentValidation.hasMinimumContextCount(exploredMethodContext)

				if (!hasMinimumContextCount) {
					return
				}

				await DataProcessUtil.process({
					batchSize: 1,
					items: options.comparisons,
					handlerFn: async (experimentComparison) => {
						let methodContextExperimentedCount = 0

						const originalTargetContext: ContextDefinition = (exploredMethodContext?.context || [])
							.filter(context => experimentComparison.context.definitions.some(({ slug }) => slug === context.slug))
							.map(context => ({
								slug: context.slug,
								type: context.type,
								path: context.resolvedFilePath,
								extractionRule: context.extractionRule as ExtractionRule<DeclarationType>
							}))

						const allTargetContextExperiments: ContextDefinition[] = []

						if (experimentComparison.context.isPermutationEnabled) {
							const targetContextPermutations = await this.getExploredMethodTargetContextPermutations(originalTargetContext)
							allTargetContextExperiments.push(...targetContextPermutations)
						} else {
							allTargetContextExperiments.push(originalTargetContext)
						}

						await DataProcessUtil.process({
							batchSize: 1,
							items: allTargetContextExperiments,
							handlerFn: async (targetContext) => {
								const experimentSize = allTargetContextExperiments.length
								const experimentIndex = methodContextExperimentedCount + 1
								const experimentSubtitle = this.buildExperimentSubtitle(experimentComparison)
								const experimentDescription = `${exploredMethod.name} > ${experimentComparison.title} > ${experimentSubtitle} [${experimentIndex}/${experimentSize}]`

								await TracingUtil.traceTask(`Experiment: ${experimentDescription}`, async (config) => {
									const noTargetContextFoundForExperiment = experimentComparison.context.definitions.length > 0 && targetContext.length === 0

									if (noTargetContextFoundForExperiment) {
										config.setOutput("No context was found for this experiment. Skipping...")
									} else {
										const sourceFileWithOriginalMethodBody = await RepositoryManagerService.getSourceFileWithOriginalMethodBody({
											methodResolvedFilePath: exploredMethod.resolvedMethodFilePath
										})

										try {
											const contextLoadResult = await ContextLoaderService.loadContext({
												context: targetContext,
												method: {
													name: exploredMethod.name as string,
													declarationType: exploredMethod.declarationType as DeclarationType,
													resolvedFilePath: exploredMethod.resolvedMethodFilePath
												},
												repositoryName: options.repositoryName
											})

											const buildPromptResult = PromptBuilderService.buildPrompt({
												buildedContext: contextLoadResult.buildedContext,
												methodFileContentWithoutMethodBody: contextLoadResult.methodFileContentWithoutMethodBody,
												methodName: exploredMethod.name as string
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

											const sourceFileWithReconstructedMethodBody = await RepositoryManagerService.setSourceFileWithReconstructedMethodBody({
												methodDeclarationType: exploredMethod.declarationType as DeclarationType,
												methodName: exploredMethod.name as string,
												methodResolvedFilePath: exploredMethod.resolvedMethodFilePath,
												reconstructedMethodBody: methodReconstructionResult.reconstructedMethodBody
											})

											const isReconstructedMethodCompilable = await RepositoryManagerService.checkSourceFileCompilation({
												methodResolvedFilePath: exploredMethod.resolvedMethodFilePath
											})

											const repositoryTestSuiteResult = await TestExecutorService.runRepositoryTestSuite({
												repositoryName: options.repositoryName,
												repositoryTestSuiteCommand: options.repositorySingleFileTestSuiteCommand.replace(METHOD_FILE_PATH_PLACEHOLDER, exploredMethod.resolvedMethodFilePath)
											})

											if (!repositoryTestSuiteResult.success) {
												config.setError(new RepositoryTestSuiteFailedError())
											}

											const testSuiteTotalTestCaseCount = await this.getExploredMethodTotalTestCaseCount(exploredMethod)
											const testSuiteFailedTestCaseCount = TestResultHandlerUtil.extractFailedTestCaseCountFromDebugMessage(repositoryTestSuiteResult.debugMessage)
											const testSuitePassedTestCaseCount = testSuiteTotalTestCaseCount - testSuiteFailedTestCaseCount
											const relevantTestCaseCount = targetContext.filter(context => context.slug === "relevant-test-case").length

											const result: ReconstructedMethodExperiment = {
												model: {
													input: {
														name: experimentComparison.model.name,
														temperature: experimentComparison.model.temperature,
														reasoningBudget: experimentComparison.model.reasoningBudget,
														systemPrompt: buildPromptResult.systemPrompt,
														userPrompt: buildPromptResult.userPrompt
													},
													output: {
														result: methodReconstructionResult.reconstructedMethodBody,
														reasoningText: methodReconstructionResult.reasoningText
													}
												},
												experiment: {
													input: {
														experimentTitle: experimentComparison.title,
														experimentDescription,
														experimentContextItemCount: targetContext.length,
														experimentIndex,
														experimentSize,
														methodName: exploredMethod.name,
														methodResolvedFilePath: exploredMethod.resolvedMethodFilePath,
														contextDefinitions: experimentComparison.context.definitions
													},
													output: {
														repositoryTestSuiteResult,
														sourceFileWithReconstructedMethodBody,
														sourceFileWithOriginalMethodBody,
														methodFileContentWithoutMethodBody: contextLoadResult.methodFileContentWithoutMethodBody
													}
												},
												metrics: {
													isTestSuiteSuccessful: repositoryTestSuiteResult.success,
													isModelResultCompilable: isReconstructedMethodCompilable,
													relevantTestCaseCount,
													testSuiteTotalTestCaseCount,
													testSuitePassedTestCaseCount,
													testSuiteFailedTestCaseCount
												}
											}

											reconstructedMethodExperiments.push(result)

											await onSingleExperimentExecuted(result)
										} catch (error) {
											ErrorHandlerUtil.handle(error)
											throw error
										} finally {
											await RepositoryManagerService.revertSourceFileChanges({
												methodResolvedFilePath: exploredMethod.resolvedMethodFilePath,
												sourceFileWithOriginalMethodBody
											})
										}
									}
								})

								methodContextExperimentedCount++
							}
						})
					}
				})

				methodExperimentedCount++
			}
		})

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

	private async getExploredMethodTotalTestCaseCount(exploredMethod: ExploredMethod): Promise<number> {
		return await TracingUtil.traceAction("Load explored method total test cases count...", async () => {
			const exploredMethodMainResolvedTestFilePath = exploredMethod.resolvedTestFilePaths[0]!
			const project = NodeJSCodeParserUtil.createProject()
			const sourceFile = project.addSourceFileAtPath(exploredMethodMainResolvedTestFilePath)

			const testCases = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-case" }])

			project.removeSourceFile(sourceFile)

			return testCases.length
		}) as number
	}

	private async getExploredMethodTargetContextPermutations(originalTargetContext: ContextDefinition): Promise<ContextDefinition[]> {
		return await TracingUtil.traceAction("Load explored method target context permutations...", async () => {
			const contextPermutations: ContextDefinition[] = []

			let pendingPermutationsCount = originalTargetContext.length

			while (pendingPermutationsCount > 0) {
				const targetContextPermutations = ArrayUtil.getValuePermutations(originalTargetContext, pendingPermutationsCount)
				const randomPermutedTargetContexts = ArrayUtil.getRandomValue(targetContextPermutations)

				contextPermutations.push(randomPermutedTargetContexts)

				pendingPermutationsCount--
			}

			return contextPermutations
		})
	}

	private buildExperimentSubtitle(experimentComparison: ExperimentComparison): string {
		const subTitleParams: string[] = []

		subTitleParams.push(`model-${experimentComparison.model.name}`)
		subTitleParams.push(`reasoning-budget-${experimentComparison.model.reasoningBudget}`)
		subTitleParams.push(`temperature-${experimentComparison.model.temperature}`)

		return subTitleParams.join("|")
	}
}

export default new MethodReconstructionExperimenterService()