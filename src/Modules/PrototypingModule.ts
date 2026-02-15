import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import {
	PrototypeOptions,
	PrototypeResult
} from "@/Protocols/PrototypingProtocol"

import LogService from "@/Services/LogService"
import FileUtil from "@/Utils/FileUtil"

class PrototypingModule {
	async prototype(options: PrototypeOptions): Promise<PrototypeResult> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)
		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const resolvedTestFilePaths = exploreMethodResult.map(result => result.resolvedMethodFilePath).flat()
		const uniqueResolvedTestFilePaths = [...new Set(resolvedTestFilePaths)]
		console.log(uniqueResolvedTestFilePaths)
	}
}

export default new PrototypingModule()
