import { FailureReason } from "@/Protocols/TestResultHandlerProtocol"

class TestResultHandlerUtil {
	extractFailedTestCaseCountFromDebugMessage(debugMessage: string): number {
		const failedTestCaseCountMatch = debugMessage.match(/Failed Tests (\d+)/)

		if (failedTestCaseCountMatch && failedTestCaseCountMatch[1]) {
			return parseInt(failedTestCaseCountMatch[1], 10)
		}

		return 0
	}

	describeTestSuiteFailureReason(debugMessage: string): FailureReason | null {
		const testCaseFailureDebugMessageTextBlocks = debugMessage.match(/FAIL[\s\S]*?\[\d+\/\d+\]/g) || []
		const allTestCaseFailureDebugMessages = testCaseFailureDebugMessageTextBlocks.join("\n")

		const errorMatches = allTestCaseFailureDebugMessages.match(/\b\w+Error(?=:)/g)

		if (!errorMatches) {
			return null
		}

		const hasSyntaxError = errorMatches.some(error => error !== "AssertionError")

		return hasSyntaxError ? "Syntax" : "Assertion"
	}
}

export default new TestResultHandlerUtil()
