import path from "path"

import { ExperimentOptions, RepositoryName } from "@/Protocols/ExperimentProtocol"
import { ContextDefinition, ContextDefinitionItem } from "@/Protocols/ContextProtocol"

class ExperimentUtil {
	resolveRelativeFilePath(repositoryName: RepositoryName, relativeFilePath: string): string {
		const repositoryRootPath = this.getRepositoryRootPath(repositoryName)

		const resolvedRelativeFilePath = path.join(repositoryRootPath, relativeFilePath)

		return resolvedRelativeFilePath
	}

	getRepositoryRootPath(repositoryName: RepositoryName): string {
		const rootDirectoryPath = process.cwd()

		const repositoryRootPath = path.join(rootDirectoryPath, "experiment-repos", repositoryName)

		return repositoryRootPath
	}

	getExperimentResultLogFilePath(experimentOptions: ExperimentOptions, logFileName: string): string {
		const experimentResultDirectoryPath = this.getExperimentResultDirectoryPath()

		const experimentResultLogFilePath = path.join(experimentResultDirectoryPath, experimentOptions.title, `${logFileName}.txt`)

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
				...(item.path && { path: this.resolveRelativeFilePath(repositoryName, item.path) })
			} as ContextDefinitionItem
		})
	}
}

export default new ExperimentUtil()
