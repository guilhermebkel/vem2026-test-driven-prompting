import { CallExpression } from "ts-morph"

class SanitizationUtil {
	extractTestCaseName(testCaseNode: CallExpression): string {
		return testCaseNode.getArguments()[0]?.getText().replace(/['"]/g, "") as string
	}
}

export default new SanitizationUtil()
