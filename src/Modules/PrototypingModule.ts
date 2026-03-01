import { ExploredMethod, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import {
	PrototypeOptions,
	PrototypeResult,
	TestCaseDistributionByMethod,
	TestCaseRelevance,
	TestRelevanceByMethod
} from "@/Protocols/PrototypingProtocol"

import LogService from "@/Services/LogService"

import FileUtil from "@/Utils/FileUtil"
import HashUtil from "@/Utils/HashUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import PathUtil from "@/Utils/PathUtil"
import SanitizationUtil from "@/Utils/SanitizationUtil"
import TestMutationRelevanceUtil from "@/Utils/TestMutationRelevanceUtil"
import TestDataFlowRelevanceUtil from "@/Utils/TestDataFlowRelevanceUtil"

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

		const allMethodTestMutationResults = await TestMutationRelevanceUtil.execute({
			repositoryRootPath: PathUtil.getRepositoryRootPath(options.repositoryName),
			targetResolvedFilePaths: resolvedMethodFilePaths,
			testRunnerId: options.testRunnerId
		})

		const project = NodeJSCodeParserUtil.createProject()

		const result: TestRelevanceByMethod[] = await Promise.all(
			filteredExploredMethods.map(async filteredExploredMethod => {
				const resultItem: TestRelevanceByMethod = {
					id: this.generateExploredMethodId(filteredExploredMethod),
					repositoryName: options.repositoryName,
					methodTitle: this.generateMethodTitle(filteredExploredMethod),
					testCaseCount: 0,
					testCaseRelevanceCount: {
						byDataFlowScore: 0,
						byMutationScore: 0
					},
					testCases: []
				}

				const testCaseDistributionByMethod = testCaseDistributionByMethodList.find(testCaseDistributionByMethod => (
					testCaseDistributionByMethod.id === this.generateExploredMethodId(filteredExploredMethod)
				))

				if (!testCaseDistributionByMethod) {
					return resultItem
				}

				resultItem.testCaseCount = testCaseDistributionByMethod.testCaseCount

				const currentTestMutationResult = allMethodTestMutationResults.find(mutationTestStrength => (
					filteredExploredMethod.resolvedMethodFilePath === mutationTestStrength.targetResolvedFilePath
				))

				const currentTestDataFlowResult = await TestDataFlowRelevanceUtil.execute({ resolvedTestFilePath: filteredExploredMethod.resolvedTestFilePaths[0]! })

				filteredExploredMethod.resolvedTestFilePaths.forEach(resolvedTestFilePath => {
					const sourceFile = project.addSourceFileAtPath(resolvedTestFilePath)

					const testCases = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-case" }])

					resultItem.testCases = testCases.map(testCase => {
						const testCaseRelevance: TestCaseRelevance = {
							name: SanitizationUtil.extractTestCaseName(testCase),
							mutationScore: "unknown",
							dataFlowScore: "unknown"
						}

						if (currentTestMutationResult) {
							const testMutationResultForTestCase = currentTestMutationResult.results.find(result => (
								result.rawTestCaseName.endsWith(testCaseRelevance.name)
								&& result.rawTestCaseName.startsWith(filteredExploredMethod.name)
							))

							testCaseRelevance.mutationScore = Number(testMutationResultForTestCase?.killedMutantsCount) > 0 ? "relevant" : "not-relevant"
						}

						if (currentTestDataFlowResult) {
							const testDataFlowResultForTestCase = currentTestDataFlowResult.find(result => (
								result.testCaseName === testCaseRelevance.name
							))

							testCaseRelevance.dataFlowScore = Object.values(testDataFlowResultForTestCase?.heuristics || {}).some(Boolean) ? "relevant" : "not-relevant"
						}

						return testCaseRelevance
					})

					project.removeSourceFile(sourceFile)
				})

				resultItem.testCaseRelevanceCount = {
					byMutationScore: resultItem.testCases.filter(testCase => testCase.mutationScore === "relevant").length,
					byDataFlowScore: resultItem.testCases.filter(testCase => testCase.dataFlowScore === "relevant").length
				}

				return resultItem
			})
		)

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
