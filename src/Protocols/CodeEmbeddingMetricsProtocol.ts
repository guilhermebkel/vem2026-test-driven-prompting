export type CodeEmbeddingRawMetrics = {
	/**
	 * Semantic similarity score between two code snippets computed as the
	 * cosine similarity of their GraphCodeBERT embeddings.
	 */
	embedding_similarity: number
}

export type CodeEmbeddingFormattedMetrics = {
	embeddingSimilarity: CodeEmbeddingRawMetrics["embedding_similarity"]
}
