import { CodeBLEURawResult, CodeBLEUFormattedResult } from "@/Protocols/CodeBLEUProtocol"

import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"

function encodeBase64(str: string): string {
	return Buffer.from(str, "utf8").toString("base64")
}

class CodeBLEUUtil {
	async compute(referenceCode: string, candidateCode: string[]): Promise<CodeBLEUFormattedResult[]> {
		const referenceB64 = encodeBase64(referenceCode)
		const hypothesesB64 = JSON.stringify(candidateCode.map(encodeBase64))

		const result = await ShellUtil.executeCommand(
			`python3 compute-code-bleu-v2.py --refs-base64 ${referenceB64} --hyps-base64 ${hypothesesB64} --lang "javascript" --workers 8`,
			PathUtil.getScriptsDirectoryPath()
		)

		const rawResults: CodeBLEURawResult[] = JSON.parse(result)

		return rawResults.map(rawResult => ({
			codebleuScore: rawResult.codebleu,
			dataflowMatchScore: rawResult.dataflow_match_score,
			ngramMatchScore: rawResult.ngram_match_score,
			syntaxMatchScore: rawResult.syntax_match_score,
			weightedNgramScore: rawResult.weighted_ngram_match_score
		}))
	}
}

export default new CodeBLEUUtil()
