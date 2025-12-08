import { ExploreContextOptions } from "@/Protocols/MethodContextExplorerProtocol"
import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"

import LogService from "@/Services/LogService"
import CodeBLEUUtil from "@/Utils/CodeBLEUUtil"

import FileUtil from "@/Utils/FileUtil"
import PathUtil from "@/Utils/PathUtil"

class MethodContextExplorerService {
	async explore(options: ExploreContextOptions): Promise<void> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)

		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const resolvedMethodFilePaths = await PathUtil.findResolvedRepositoryFilePaths(options.repositoryName, options.methodFilePatterns, options.testFilePatterns)

		for (const exploredMethod of exploreMethodResult) {
			for (const resolvedMethodFilePath of resolvedMethodFilePaths) {
				await CodeBLEUUtil.compute(exploredMethod.resolvedMethodFilePath, resolvedMethodFilePath, "js")
			}
		}

		console.log(resolvedMethodFilePaths)
	}
}

export default new MethodContextExplorerService()
