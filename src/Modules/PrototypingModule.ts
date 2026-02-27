import { ExploredMethod, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import {
	PrototypeOptions,
	PrototypeResult,
	TestCaseDistributionByMethod,
	TestRelevanceByMethod
} from "@/Protocols/PrototypingProtocol"

import LogService from "@/Services/LogService"

import FileUtil from "@/Utils/FileUtil"
import HashUtil from "@/Utils/HashUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import MutationTestUtil from "@/Utils/MutationTestUtil"
import PathUtil from "@/Utils/PathUtil"

import { methodWithRelevantTestsValidation } from "@/Config/PrototypeConfig"

class PrototypingModule {
	async prototype(options: PrototypeOptions): Promise<PrototypeResult> {
		const [
			testCaseDistributionByMethod,
			testRelevanceByMethod
		] = await Promise.all([
			await this.collectTestCaseDistributionByMethod(options),
			await this.collectTestRelevanceByMethod(options)
		])

		const prototypeResult: PrototypeResult = {
			testCaseDistributionByMethod,
			testRelevanceByMethod
		}

		await LogService.savePrototypeLogs(options, prototypeResult)

		return prototypeResult
	}

	private async collectTestRelevanceByMethod(options: PrototypeOptions): Promise<TestRelevanceByMethod[]> {
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

		const resolvedMethodFilePaths = filteredExploredMethods.map(exploredMethod => exploredMethod.resolvedMethodFilePath)

		const mutationTestResult = await MutationTestUtil.execute({
			repositoryRootPath: PathUtil.getRepositoryRootPath(options.repositoryName),
			targetResolvedFilePaths: resolvedMethodFilePaths,
			testRunnerId: options.testRunnerId
		})

		const project = NodeJSCodeParserUtil.createProject()

		const result: TestRelevanceByMethod[] = filteredExploredMethods.map(filteredExploredMethod => {
			const resultItem: TestRelevanceByMethod = {
				id: this.generateExploredMethodId(filteredExploredMethod),
				repositoryName: options.repositoryName,
				methodTitle: this.generateMethodTitle(filteredExploredMethod),
				testCaseCount: 0,
				testCaseMutationRelevanceCount: 0,
				testCases: []
			}

			const testCaseDistributionByMethod = testCaseDistributionByMethodList.find(testCaseDistributionByMethod => (
				testCaseDistributionByMethod.id === this.generateExploredMethodId(filteredExploredMethod)
			))

			if (!testCaseDistributionByMethod) {
				return resultItem
			}

			resultItem.testCaseCount = testCaseDistributionByMethod.testCaseCount

			const currentMethodMutationTestResult = mutationTestResult.find(mutationTestResultItem => (
				filteredExploredMethod.resolvedMethodFilePath === mutationTestResultItem.targetResolvedFilePath
			))

			filteredExploredMethod.resolvedTestFilePaths.forEach(testFilePath => {
				const sourceFile = project.addSourceFileAtPath(testFilePath)

				const testCases = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-case" }])

				resultItem.testCases = testCases.map(testCase => {
					const testCaseName = String(testCase.getArguments()?.[0]?.getText()?.replace(/"/g, ""))

					if (!currentMethodMutationTestResult) {
						return {
							name: testCaseName,
							mutationScore: "unknown"
						}
					}

					const mutationTestResultForTestCase = currentMethodMutationTestResult.results.find(result => (
						result.rawTestCaseName.endsWith(testCaseName)
						&& result.rawTestCaseName.startsWith(filteredExploredMethod.name)
					))

					return {
						name: testCaseName,
						mutationScore: Number(mutationTestResultForTestCase?.killedMutantsCount) > 0 ? "relevant" : "not-relevant"
					}
				})

				project.removeSourceFile(sourceFile)
			})

			resultItem.testCaseMutationRelevanceCount = resultItem.testCases.filter(testCase => testCase.mutationScore === "relevant").length

			return resultItem
		})

		return result
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
				methodTitle: this.generateMethodTitle(methodExplorationResult),
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

	private generateMethodTitle(exploredMethod: ExploredMethod): string {
		return `${exploredMethod.declarationType}:${exploredMethod.name}`
	}
}

export default new PrototypingModule()
