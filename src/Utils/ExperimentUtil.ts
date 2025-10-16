import path from "path"

import { RepositoryName } from "@/Protocols/ExperimentProtocol"
import { ContextDefinition, ContextDefinitionItem } from "@/Protocols/ContextProtocol"

class ExperimentUtil {
	resolveRelativeFilePath(repositoryName: RepositoryName, relativeFilePath: string): string {
		const rootDirectoryPath = process.cwd()
		const resolvedRelativeFilePath = path.join(rootDirectoryPath, "experiment-repos", repositoryName, relativeFilePath)

		return resolvedRelativeFilePath
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
