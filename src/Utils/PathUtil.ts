import path from "path"

import { RepositoryName } from "@/Protocols/RepositoryProtocol"

class PathUtil {
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
}

export default new PathUtil()
