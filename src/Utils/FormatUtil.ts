import { CallExpression } from "ts-morph"

class FormatUtil {
	extractTestCaseName(testCaseNode: CallExpression): string {
		return testCaseNode.getArguments()[0]?.getText().replace(/['"]/g, "") as string
	}
}

export default new FormatUtil()
