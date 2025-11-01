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

	resolveContextRelativeFilePath(contextDefinition: ContextDefinition, repositoryName: RepositoryName): ContextDefinition {
		return contextDefinition.map((item) => {
			return {
				...item,
				...(item.path && { path: PathUtil.resolveRelativeFilePath(repositoryName, item.path) })
			} as ContextDefinitionItem
		})
	}
}

export default new ExperimentUtil()
