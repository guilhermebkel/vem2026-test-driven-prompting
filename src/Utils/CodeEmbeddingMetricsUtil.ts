import { CodeEmbeddingFormattedMetrics, CodeEmbeddingRawMetrics } from "@/Protocols/CodeEmbeddingMetricsProtocol"
import { Config } from "@/Protocols/CodeMetricsProtocol"

import BaseCodeMetricsUtil from "@/Utils/BaseCodeMetricsUtil"

class CodeEmbeddingMetricsUtil extends BaseCodeMetricsUtil<CodeEmbeddingFormattedMetrics, CodeEmbeddingRawMetrics> {
	protected getConfig(): Config {
		return {
			batch: {
				maxAccumulatedCount: 1000,
				maxWaitingTimeInMilliseconds: 500
			},
			shell: {
				scriptFileName: "compute-code-embedding.py",
				scriptArguments: "",
				scriptEnvironmentVariables: {}
			}
		}
	}

	protected formatRawMetrics(rawMetrics: CodeEmbeddingRawMetrics): CodeEmbeddingFormattedMetrics {
		return {
			embeddingSimilarity: rawMetrics.embedding_similarity
		}
	}
}

export default new CodeEmbeddingMetricsUtil()
