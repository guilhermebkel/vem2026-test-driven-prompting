export type CodeEmbeddingRawMetrics = {
	/**
	 * GraphCodeBERT cosine similarity result.
	 */
	embedding_similarity: number
}

export type CodeEmbeddingFormattedMetrics = {
	embeddingSimilarity: CodeEmbeddingRawMetrics["embedding_similarity"]
}
