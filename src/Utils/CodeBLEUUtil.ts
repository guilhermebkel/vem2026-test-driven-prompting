import path from "path"

import { CodeBLEURawResult, CodeBLEUFormattedResult, CodeBLEUOptions, CodeBLEURawInput } from "@/Protocols/CodeBLEUProtocol"

import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import IdentificationUtil from "@/Utils/IdentificationUtil"
import FileUtil from "@/Utils/FileUtil"

class CodeBLEUUtil {
	private readonly computeInBatch = DataProcessUtil.getBatchAccumulatorProcessor<CodeBLEUOptions, CodeBLEURawResult>({
		maxAccumulatedCount: 500,
		maxWaitingTimeInMilliseconds: 500,
		onItemBatchProcess: async (data) => {
			const batchInput: CodeBLEURawInput[] = data.map(pair => ({
				ref: pair.item.referenceCode,
				hyp: pair.item.hypothesisCode
			}))

			const batchResult = await this.callCodeBLEUScript(batchInput)

			return data.map(({ id }, index) => ({
				id: id,
				result: batchResult.at(index) as CodeBLEURawResult
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

	async callCodeBLEUScript(batchInput: CodeBLEURawInput[]): Promise<CodeBLEURawResult[]> {
		/**
		 * WARNING:
		 * - Always provide a file as input for the CodeBLEU script. Individual input can be very large,
		 * and passing them directly as command-line arguments may exceed system limits and cause the process to fail (e.g., spawn E2BIG error).
		 */
		const tempDirectoryPath = PathUtil.getTempDirectoryPath()
		const batchInputFilePath = path.join(tempDirectoryPath, `${IdentificationUtil.generateUUID()}.json`)
		const batchInputInJsonString = JSON.stringify(batchInput)
		await FileUtil.setFileContent(batchInputFilePath, batchInputInJsonString)

		const result = await ShellUtil.executeCommand(
			`python3 compute-code-bleu.py --pairs-file '${batchInputFilePath}' --lang javascript --workers 14`,
			PathUtil.getScriptsDirectoryPath()
		)

		await FileUtil.deleteFile(batchInputFilePath)

		const batchResult: CodeBLEURawResult[] = JSON.parse(result)

		return batchResult
	}
}

export default new CodeBLEUUtil()
