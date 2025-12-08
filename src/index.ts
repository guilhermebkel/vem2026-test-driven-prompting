import "dotenv/config"

import ExperimentationModule from "@/Modules/ExperimentationModule"
import ExplorationModule from "@/Modules/ExplorationModule"

import TracingUtil from "@/Utils/TracingUtil"
import ProcessArgumentUtil from "@/Utils/ProcessArgumentUtil"

import RepositoryTestSuiteFailedError from "@/Errors/RepositoryTestSuiteFailedError"

import { methodReconstructionExperimentConfig } from "@/Config/MethodReconstructionExperimentConfig"
import { methodExplorationConfig } from "@/Config/MethodExplorationConfig"
import { methodContextExplorationConfig } from "@/Config/MethodContextExplorationConfig"

import { PipelineType } from "@/Protocols/ProcessArgumentProtocol"

async function main(): Promise<void> {
	const parsedProcessArguments = ProcessArgumentUtil.parseArgs(process.argv)

	const pipelineTypeToPipelineHandlerFn: Record<PipelineType, () => Promise<void>> = {
		"method-reconstruction-experiment": async () => {
			for (const repositoryExperiment of methodReconstructionExperimentConfig) {
				await TracingUtil.traceTask(`Repository: ${repositoryExperiment.repositoryName}`, async () => {
					for (const experiment of repositoryExperiment.experiments) {
						await TracingUtil.traceTask(`Experiment: ${experiment.title}`, async (config) => {
							const result = await ExperimentationModule.runMethodReconstructionExperiment({
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
		},
		"method-exploration": async () => {
			for (const repositoryMethodExploration of methodExplorationConfig) {
				await TracingUtil.traceTask(`Explore Repository Methods: ${repositoryMethodExploration.exploreOptions.repositoryName}`, async () => {
					await ExplorationModule.exploreMethods(repositoryMethodExploration)
				})
			}
		},
		"method-context-exploration": async () => {
			for (const repositoryMethodContextExploration of methodContextExplorationConfig) {
				await TracingUtil.traceTask(`Explore Repository Method Contexts: ${repositoryMethodContextExploration.exploreOptions.repositoryName}`, async () => {
					await ExplorationModule.exploreMethodContexts(repositoryMethodContextExploration)
				})
			}
		}
	}

	const selectedPipelineHandlerFn = pipelineTypeToPipelineHandlerFn[parsedProcessArguments.pipeline]

	if (!selectedPipelineHandlerFn) {
		throw new Error(`Invalid pipeline type specified: '${parsedProcessArguments.pipeline}'`)
	}

	await selectedPipelineHandlerFn()
}

main()
