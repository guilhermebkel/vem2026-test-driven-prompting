import { ExploreContextOptions } from "@/Protocols/MethodContextExplorerProtocol"
import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"

import LogService from "@/Services/LogService"
import FileUtil from "@/Utils/FileUtil"

class MethodContextExplorerService {
	async explore(options: ExploreContextOptions): Promise<void> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)

		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)
		console.log(exploreMethodResult)
	}
}

export default new MethodContextExplorerService()
