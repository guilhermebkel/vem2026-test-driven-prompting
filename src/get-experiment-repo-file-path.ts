import path from "path"

export type RepositoryName = "date-fns"

export const getExperimentRepoFilePath = (experimentRepo: RepositoryName, filePath: string): string => {
	const rootDirectoryPath = process.cwd()
	const experimentRepoFilePath = path.join(rootDirectoryPath, "experiment-repos", experimentRepo, filePath)

	return experimentRepoFilePath
}
