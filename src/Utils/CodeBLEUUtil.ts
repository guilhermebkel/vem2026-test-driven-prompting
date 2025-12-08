import path from "path"

import { CodeBLEURawResult, CodeBLEUFormattedResult, CodeBLEUOptions, CodeBLEURawInput } from "@/Protocols/CodeBLEUProtocol"

import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import IdentificationUtil from "@/Utils/IdentificationUtil"
import FileUtil from "@/Utils/FileUtil"

class CodeBLEUUtil {
	private readonly computeInBatch = DataProcessUtil.getBatchAccumulatorProcessor<CodeBLEUOptions["pairs"], CodeBLEURawResult[]>({
		maxAccumulatedCount: 100,
		maxWaitingTimeInMilliseconds: 200,
		onItemBatchProcess: async (data) => {
			const pairs: CodeBLEUOptions["pairs"] = []
			const dataIdToPairIndex: Record<string, { startIndex: number; endIndex: number }> = {}

			data.forEach(({ id, item }) => {
				dataIdToPairIndex[id] = {
					startIndex: pairs.length,
					endIndex: pairs.length + item.length
				}

				pairs.push(...item)
			})

			const codeBLEURawInput: CodeBLEURawInput[] = pairs.map(pair => ({
				slug: pair.slug,
				ref: pair.referenceCode,
				hyp: pair.hypothesisCode
			}))

			const rawResults = await this.callCodeBLEUScript(codeBLEURawInput)

			return Object.entries(dataIdToPairIndex).map(([dataId, { startIndex, endIndex }]) => {
				return {
					id: dataId,
					result: rawResults.slice(startIndex, endIndex)
				}
			})
		}
	})

	async compute(options: CodeBLEUOptions): Promise<CodeBLEUFormattedResult[]> {
		if (!options.pairs.length) {
			return []
		}

		const results = await this.computeInBatch(options.pairs)

		const formattedResults: CodeBLEUFormattedResult[] = results.map(rawResult => ({
			codebleuScore: rawResult.success?.codebleu || 0,
			dataflowMatchScore: rawResult.success?.dataflow_match_score || 0,
			ngramMatchScore: rawResult.success?.ngram_match_score || 0,
			syntaxMatchScore: rawResult.success?.syntax_match_score || 0,
			weightedNgramScore: rawResult.success?.weighted_ngram_match_score || 0
		}))

		return formattedResults
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
			`python3 compute-code-bleu-v2.py --pairs-file '${pairsFilePath}' --lang javascript --workers 16`,
			PathUtil.getScriptsDirectoryPath()
		)

		await FileUtil.deleteFile(pairsFilePath)

		const rawResults: CodeBLEURawResult[] = JSON.parse(result)

		return rawResults
	}
}

export default new CodeBLEUUtil()
