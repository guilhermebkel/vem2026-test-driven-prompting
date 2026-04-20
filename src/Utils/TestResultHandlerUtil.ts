import { FailureReason } from "@/Protocols/TestResultHandlerProtocol"

class TestResultHandlerUtil {
	describeFailedTestCaseCount(debugMessage: string): number {
		const testCaseFailureDebugMessageTextBlocks = this.extractTestCaseFailureDebugMessageTextBlocks(debugMessage)

		return testCaseFailureDebugMessageTextBlocks.length
	}

	describeTestSuiteFailureReason(debugMessage: string): FailureReason | null {
		const testCaseFailureDebugMessageTextBlocks = this.extractTestCaseFailureDebugMessageTextBlocks(debugMessage)
		const allTestCaseFailureDebugMessages = testCaseFailureDebugMessageTextBlocks.join("\n")

		const errorMatches = allTestCaseFailureDebugMessages.match(/\b\w+Error(?=:)/g)

		if (!errorMatches) {
			return null
		}

		const hasSyntaxError = errorMatches.some(error => error !== "AssertionError")

		return hasSyntaxError ? "Syntax" : "Assertion"
	}

	private extractTestCaseFailureDebugMessageTextBlocks(debugMessage: string): string[] {
		return debugMessage.match(/FAIL[\s\S]*?\[\d+\/\d+\]/g) || []
	}
}

export default new TestResultHandlerUtil()
