import { CodeBLEURawResult, CodeBLEUFormattedResult, CodeBLEUOptions } from "@/Protocols/CodeBLEUProtocol"

import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"

class CodeBLEUUtil {
	async compute(options: CodeBLEUOptions): Promise<CodeBLEUFormattedResult[]> {
		if (!options.pairs.length) {
			return []
		}

		const pairsInJsonString = JSON.stringify(
			options.pairs.map(pair => ({
				ref: pair.referenceCode,
				hyp: pair.hypothesisCode
			}))
		)

		const pairsInBase64 = Buffer.from(pairsInJsonString).toString("base64")

		const result = await ShellUtil.executeCommand(
			`python3 compute-code-bleu-v2.py --pairs-base64 '${pairsInBase64}' --lang javascript --workers 16`,
			PathUtil.getScriptsDirectoryPath()
		)

		const rawResults: CodeBLEURawResult[] = JSON.parse(result)

		return rawResults.map(rawResult => ({
			codebleuScore: rawResult.success?.codebleu,
			dataflowMatchScore: rawResult.success?.dataflow_match_score,
			ngramMatchScore: rawResult.success?.ngram_match_score,
			syntaxMatchScore: rawResult.success?.syntax_match_score,
			weightedNgramScore: rawResult.success?.weighted_ngram_match_score
		}))
	}
}

export default new CodeBLEUUtil()
