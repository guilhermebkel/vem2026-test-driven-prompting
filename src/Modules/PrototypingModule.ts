import { ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import {
	PrototypeOptions,
	PrototypeResult,
	TestCaseDistributionByMethod
} from "@/Protocols/PrototypingProtocol"

import LogService from "@/Services/LogService"

import FileUtil from "@/Utils/FileUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"

class PrototypingModule {
	async prototype(options: PrototypeOptions): Promise<PrototypeResult> {
		const [testCaseDistributionByMethod] = await Promise.all([
			await this.collectTestCaseDistributionByMethod(options)
		])

		const prototypeResult: PrototypeResult = {
			testCaseDistributionByMethod
		}

		await LogService.savePrototypeLogs(options, prototypeResult)

		return prototypeResult
	}

	private async collectTestCaseDistributionByMethod(options: PrototypeOptions): Promise<TestCaseDistributionByMethod[]> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)
		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const project = NodeJSCodeParserUtil.createProject()

		const result: TestCaseDistributionByMethod[] = []

		exploreMethodResult.forEach(methodExplorationResult => {
			const resultItem: TestCaseDistributionByMethod = {
				repositoryName: options.repositoryName,
				methodTitle: `${methodExplorationResult.declarationType}:${methodExplorationResult.name}`,
				testSuiteCount: methodExplorationResult.resolvedTestFilePaths.length,
				testCaseCount: 0
			}

			methodExplorationResult.resolvedTestFilePaths.forEach(testFilePath => {
				const sourceFile = project.addSourceFileAtPath(testFilePath)

				const testCases = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-case" }])

				resultItem.testCaseCount += testCases.length

				project.removeSourceFile(sourceFile)
			})

			result.push(resultItem)
		})

		return result
	}
}

export default new PrototypingModule()
