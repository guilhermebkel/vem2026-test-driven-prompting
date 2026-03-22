import path from "path"
import glob from "fast-glob"
import micromatch from "micromatch"

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

	getLogsDirectoryPath(): string {
		const rootDirectoryPath = process.cwd()

		const logsDirectoryPath = path.join(rootDirectoryPath, "logs")

		return logsDirectoryPath
	}

	getCachesDirectoryPath(): string {
		const rootDirectoryPath = process.cwd()

		const logsDirectoryPath = path.join(rootDirectoryPath, "caches")

		return logsDirectoryPath
	}

	getScriptsDirectoryPath(): string {
		const rootDirectoryPath = process.cwd()

		const scriptsDirectoryPath = path.join(rootDirectoryPath, "scripts")

		return scriptsDirectoryPath
	}

	getTempDirectoryPath(): string {
		const rootDirectoryPath = process.cwd()

		const tempDirectoryPath = path.join(rootDirectoryPath, "temp")

		return tempDirectoryPath
	}

	async findResolvedRepositoryFilePaths(repositoryName: RepositoryName, filePatterns: string[], ignoredPatterns: string[] = []): Promise<string[]> {
		const repositoryRootPath = this.getRepositoryRootPath(repositoryName)

		const repositoryFilePaths = await glob(filePatterns, {
			cwd: repositoryRootPath,
			ignore: ["**/node_modules/**", "**/dist/**", ...ignoredPatterns]
		})

		const resolvedRepositoryFilePaths = repositoryFilePaths.map(repositoryFilePath => this.resolveRelativeFilePath(repositoryName, repositoryFilePath))

		return resolvedRepositoryFilePaths
	}

	pathMatchesPatterns(path: string, patterns: string[]): boolean {
		return micromatch.isMatch(path, patterns)
	}
}

export default new PathUtil()
