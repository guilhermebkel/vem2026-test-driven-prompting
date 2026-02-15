import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import {
	PrototypeOptions,
	PrototypeResult,
	PrototypeResultItem
} from "@/Protocols/PrototypingProtocol"

import LogService from "@/Services/LogService"

import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"

class PrototypingModule {
	async prototype(options: PrototypeOptions): Promise<PrototypeResult> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)
		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const project = NodeJSCodeParserUtil.createProject()

		const prototypeResult: PrototypeResult = []

		exploreMethodResult.forEach(result => {
			const prototypeResultItem: PrototypeResultItem = {
				repositoryName: options.repositoryName,
				methodTitle: `${result.declarationType}:${result.name}`,
				testSuiteCount: result.resolvedTestFilePaths.length,
				testCaseCount: 0
			}

			result.resolvedTestFilePaths.forEach(testFilePath => {
				const sourceFile = project.addSourceFileAtPath(testFilePath)

				const testCases = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-case" }])

				prototypeResultItem.testCaseCount += testCases.length

				project.removeSourceFile(sourceFile)
			})

			prototypeResult.push(prototypeResultItem)
		})

		await LogService.savePrototypeLogs(options, prototypeResult)

		return prototypeResult
	}
}

export default new PrototypingModule()
