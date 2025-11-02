import "dotenv/config"

import ExperimentationModule from "@/Modules/ExperimentationModule"
import ExplorationModule from "@/Modules/ExplorationModule"

import TracingUtil from "@/Utils/TracingUtil"

import RepositoryTestSuiteFailedError from "@/Errors/RepositoryTestSuiteFailedError"

import { methodReconstructionExperimentConfig } from "@/Config/MethodReconstructionExperimentConfig"
import { methodExplorationConfig } from "@/Config/MethodExplorationConfig"

async function start(): Promise<void> {
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
}

async function start2(): Promise<void> {
	for (const repositoryMethodExploration of methodExplorationConfig) {
		await TracingUtil.traceTask(`Explore Repository Methods: ${repositoryMethodExploration.exploreOptions.repositoryName}`, async () => {
			await ExplorationModule.exploreMethods(repositoryMethodExploration)
		})
	}
}

start2()