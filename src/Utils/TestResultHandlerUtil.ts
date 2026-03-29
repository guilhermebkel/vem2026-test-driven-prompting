class TestResultHandlerUtil {
	extractFailedTestCaseCountFromDebugMessage(debugMessage: string): number {
		const failedTestCaseCountMatch = debugMessage.match(/Failed Tests (\d+)/)

		if (failedTestCaseCountMatch && failedTestCaseCountMatch[1]) {
			return parseInt(failedTestCaseCountMatch[1], 10)
		}

		return 0
	}
}

export default new TestResultHandlerUtil()
