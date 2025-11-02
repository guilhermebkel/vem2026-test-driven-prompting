import path from "path"

import { RepositoryName } from "@/Protocols/RepositoryProtocol"
import { ExperimentOptions } from "@/Protocols/ExperimentationProtocol"
import { ContextDefinition, ContextDefinitionItem } from "@/Protocols/ContextProtocol"

import PathUtil from "@/Utils/PathUtil"

class ExperimentUtil {
	getExperimentResultLogFilePath(experimentOptions: ExperimentOptions, logFileName: string, logFileExtension = ".txt"): string {
		const experimentResultDirectoryPath = this.getExperimentResultDirectoryPath()

		const experimentResultLogFilePath = path.join(experimentResultDirectoryPath, experimentOptions.method.repositoryName, experimentOptions.title, `${logFileName}${logFileExtension}`)

		return experimentResultLogFilePath
	}

	getExperimentResultDirectoryPath(): string {
		const rootDirectoryPath = process.cwd()

		const experimentResultDirectoryPath = path.join(rootDirectoryPath, "experiment-results")

		return experimentResultDirectoryPath
	}
}

export default new ExperimentUtil()
