import path from "path"

import { RepositoryName } from "@/Protocols/ExperimentProtocol"
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
