import path from "path"

import { CodeBLEURawResult, CodeBLEUFormattedResult, CodeBLEUOptions, CodeBLEURawInput } from "@/Protocols/CodeBLEUProtocol"

import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import IdentificationUtil from "@/Utils/IdentificationUtil"
import FileUtil from "@/Utils/FileUtil"

class CodeBLEUUtil {
	private readonly computeInBatch = DataProcessUtil.getBatchAccumulatorProcessor<CodeBLEUOptions, CodeBLEURawResult>({
		maxAccumulatedCount: 800,
		maxWaitingTimeInMilliseconds: 500,
		onItemBatchProcess: async (data) => {
			const codeBLEURawInput: CodeBLEURawInput[] = data.map(pair => ({
				slug: pair.item.slug,
				ref: pair.item.referenceCode,
				hyp: pair.item.hypothesisCode
			}))

			const rawResults = await this.callCodeBLEUScript(codeBLEURawInput)

			return data.map(({ id }, index) => ({
				id: id,
				result: rawResults.at(index) as CodeBLEURawResult
			}))
		}
	})

	async compute(options: CodeBLEUOptions): Promise<CodeBLEUFormattedResult> {
		const result = await this.computeInBatch(options)

		return {
			codebleuScore: result.success?.codebleu || 0,
			dataflowMatchScore: result.success?.dataflow_match_score || 0,
			ngramMatchScore: result.success?.ngram_match_score || 0,
			syntaxMatchScore: result.success?.syntax_match_score || 0,
			weightedNgramScore: result.success?.weighted_ngram_match_score || 0
		}
	}

	async callCodeBLEUScript(pairs: CodeBLEURawInput[]): Promise<CodeBLEURawResult[]> {
		const pairsInJsonString = JSON.stringify(pairs)
		const tempDirectoryPath = PathUtil.getTempDirectoryPath()

		/**
		 * WARNING:
		 * - Always provide a file as input for the CodeBLEU script. Individual code pairs can be very large,
		 * and passing them directly as command-line arguments may exceed system limits and cause the process to fail (e.g., spawn E2BIG error).
		 */
		const pairsFilePath = path.join(tempDirectoryPath, `${IdentificationUtil.generateUUID()}.json`)
		await FileUtil.setFileContent(pairsFilePath, pairsInJsonString)

		const result = await ShellUtil.executeCommand(
			`python3 compute-code-bleu-v2.py --pairs-file '${pairsFilePath}' --lang javascript --workers 20`,
			PathUtil.getScriptsDirectoryPath()
		)

		await FileUtil.deleteFile(pairsFilePath)

		const rawResults: CodeBLEURawResult[] = JSON.parse(result)

		return rawResults
	}
}

export default new CodeBLEUUtil()
