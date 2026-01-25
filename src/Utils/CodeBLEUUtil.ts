import { CodeBLEUFormattedMetrics, CodeBLEURawMetrics } from "@/Protocols/CodeBLEUProtocol"
import { Config } from "@/Protocols/CodeMetricsProtocol"

import BaseCodeMetricsUtil from "@/Utils/BaseCodeMetricsUtil"

class CodeBLEUUtil extends BaseCodeMetricsUtil<CodeBLEUFormattedMetrics, CodeBLEURawMetrics> {
	protected getConfig(): Config {
		return {
			batch: {
				maxAccumulatedCount: 500,
				maxWaitingTimeInMilliseconds: 500
			},
			shell: {
				scriptFileName: "compute-code-bleu.py",
				scriptArguments: "--lang javascript --workers 14",
				scriptEnvironmentVariables: {
					/**
					 * WARNING:
					 * - Forces deterministic iteration order in Python dict/set to avoid CodeBLEU score nondeterminism.
					 */
					PYTHONHASHSEED: "0"
				}
			}
		}
	}

	protected formatRawMetrics(rawMetrics: CodeBLEURawMetrics): CodeBLEUFormattedMetrics {
		return {
			codebleuScore: rawMetrics["codebleu"],
			ngramMatchScore: rawMetrics["ngram_match_score"],
			weightedNgramScore: rawMetrics["weighted_ngram_match_score"],
			syntaxMatchScore: rawMetrics["syntax_match_score"],
			dataflowMatchScore: rawMetrics["dataflow_match_score"]
		}
	}
}

export default new CodeBLEUUtil()
