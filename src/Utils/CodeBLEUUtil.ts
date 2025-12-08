import { CodeBLEURawResult, CodeBLEUFormattedResult } from "@/Protocols/CodeBLEUProtocol"

import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"

class CodeBLEUUtil {
	async compute(referenceCode: string, candidateCode: string): Promise<CodeBLEUFormattedResult> {
		const refsB64 = Buffer.from(referenceCode, "utf8").toString("base64")
		const hypB64 = Buffer.from(candidateCode, "utf8").toString("base64")

		const result = await ShellUtil.executeCommand(
			`python3 compute-code-bleu-v2.py --refs ${refsB64} --hyp ${hypB64} --lang "javascript"`,
			PathUtil.getScriptsDirectoryPath()
		)

		const rawResult: CodeBLEURawResult = JSON.parse(result)

		return {
			codebleuScore: rawResult.codebleu,
			dataflowMatchScore: rawResult.dataflow_match_score,
			ngramMatchScore: rawResult.ngram_match_score,
			syntaxMatchScore: rawResult.syntax_match_score,
			weightedNgramScore: rawResult.weighted_ngram_match_score
		}
	}
}

export default new CodeBLEUUtil()
