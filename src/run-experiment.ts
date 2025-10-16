import { MethodReconstructionOptions, reconstructMethod } from "@/reconstruct-method"
import { RepositoryName } from "@/get-experiment-repo-file-path"

export type MethodDefinition = {
	name: string
	repositoryName: RepositoryName
	testRelativeFilePath: string
}

type RunExperimentOptions = {
	method: MethodDefinition
	reconstructionOptions: MethodReconstructionOptions
}

export const runExperiment = async (options: RunExperimentOptions): Promise<void> => {
	const reconstructedMethod = await reconstructMethod(options.method, options.reconstructionOptions)

	console.log(reconstructedMethod)
}
