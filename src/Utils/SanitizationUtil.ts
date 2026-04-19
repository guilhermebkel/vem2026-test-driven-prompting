import { CallExpression } from "ts-morph"

class SanitizationUtil {
	extractTestCaseName(testCaseNode: CallExpression): string {
		return testCaseNode.getArguments()[0]?.getText().replace(/['"]/g, "") as string
	}

	sanitizeRawReconstructedMethodBody(rawReconstructedMethodBody: string): string {
		const sanitizationFunctions: Array<(text: string) => string> = [
			...[
				/**
				 * Strip markdown code block fences (opening and closing).
				 */
				(text: string): string => text.replace(/^```[\w]*\n?/gm, ""),
				(text: string): string => text.replace(/```$/gm, "")
			],
			(text: string): string => text.trim()
		]

		const sanitizedReconstructedMethodBody = sanitizationFunctions.reduce((currentSanitizedText, sanitizationFn) => (
			sanitizationFn(currentSanitizedText)
		), rawReconstructedMethodBody)

		return sanitizedReconstructedMethodBody
	}
}

export default new SanitizationUtil()
