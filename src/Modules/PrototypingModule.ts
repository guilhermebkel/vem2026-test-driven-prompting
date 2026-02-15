import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import {
	PrototypeOptions,
	PrototypeResult
} from "@/Protocols/PrototypingProtocol"

import LogService from "@/Services/LogService"

import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"

class PrototypingModule {
	async prototype(options: PrototypeOptions): Promise<PrototypeResult> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)
		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const resolvedTestFilePaths = exploreMethodResult.map(result => result.resolvedTestFilePaths).flat()
		const uniqueResolvedTestFilePaths = [...new Set(resolvedTestFilePaths)]

		const project = NodeJSCodeParserUtil.createProject()

		const prototypeResult: { [testFilePath: string]: { testCaseCount: number } } = {}

		uniqueResolvedTestFilePaths.forEach(testFilePath => {
			const sourceFile = project.addSourceFileAtPath(testFilePath)

			const testCalls = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-call" }])

			prototypeResult[testFilePath] = {
				testCaseCount: testCalls.length
			}

			project.removeSourceFile(sourceFile)
		})

		await LogService.savePrototypeLogs(options, prototypeResult)

		return prototypeResult
	}
}

export default new PrototypingModule()
