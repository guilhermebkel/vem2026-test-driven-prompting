import { CodeEmbeddingFormattedMetrics, CodeEmbeddingRawMetrics } from "@/Protocols/CodeEmbeddingMetricsProtocol"
import { Config } from "@/Protocols/CodeMetricsProtocol"

import BaseCodeMetricsUtil from "@/Utils/BaseCodeMetricsUtil"

class CodeEmbeddingMetricsUtil extends BaseCodeMetricsUtil<CodeEmbeddingFormattedMetrics, CodeEmbeddingRawMetrics> {
	protected getConfig(): Config {
		return {
			batch: {
				maxAccumulatedCount: 3000,
				maxWaitingTimeInMilliseconds: 2000
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
