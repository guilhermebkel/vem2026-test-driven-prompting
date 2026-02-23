import { ExploredMethod, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import {
	PrototypeOptions,
	PrototypeResult,
	TestCaseDistributionByMethod
} from "@/Protocols/PrototypingProtocol"

import LogService from "@/Services/LogService"

import FileUtil from "@/Utils/FileUtil"
import HashUtil from "@/Utils/HashUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"

import { methodWithRelevantTestsValidation } from "@/Config/PrototypeConfig"

class PrototypingModule {
	async prototype(options: PrototypeOptions): Promise<PrototypeResult> {
		const [testCaseDistributionByMethod] = await Promise.all([
			await this.collectTestCaseDistributionByMethod(options),
			await this.collectMethodsWithRelevantTests(options)
		])

		const prototypeResult: PrototypeResult = {
			testCaseDistributionByMethod
		}

		await LogService.savePrototypeLogs(options, prototypeResult)

		return prototypeResult
	}

	private async collectMethodsWithRelevantTests(options: PrototypeOptions): Promise<void> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)
		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const testCaseDistributionByMethodList = await this.collectTestCaseDistributionByMethod(options)

		const filteredExploredMethods = exploreMethodResult.filter(methodExplorationResult => {
			const testCaseDistributionByMethod = testCaseDistributionByMethodList.find(testCaseDistributionByMethod => (
				testCaseDistributionByMethod.id === this.generateExploredMethodId(methodExplorationResult)
			))

			if (!testCaseDistributionByMethod) {
				return false
			}

			return (
				methodWithRelevantTestsValidation.hasMaxTestFileCount(testCaseDistributionByMethod)
				&& methodWithRelevantTestsValidation.hasMinTestCaseCount(testCaseDistributionByMethod)
			)
		})

		console.log(filteredExploredMethods.length)
	}

	private async collectTestCaseDistributionByMethod(options: PrototypeOptions): Promise<TestCaseDistributionByMethod[]> {
		const methodExplorationResultLogFilePath = LogService.getMethodExplorationResultLogFilePath(options.repositoryName)
		const methodExplorationResultLogFileContent = await FileUtil.getFileContent(methodExplorationResultLogFilePath)
		const exploreMethodResult: ExploreMethodResult = JSON.parse(methodExplorationResultLogFileContent)

		const project = NodeJSCodeParserUtil.createProject()

		const result: TestCaseDistributionByMethod[] = []

		exploreMethodResult.forEach(methodExplorationResult => {
			const resultItem: TestCaseDistributionByMethod = {
				id: this.generateExploredMethodId(methodExplorationResult),
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

	private generateExploredMethodId(exploredMethod: ExploredMethod): string {
		return HashUtil.turnIntoSHA1(exploredMethod)
	}
}

export default new PrototypingModule()
