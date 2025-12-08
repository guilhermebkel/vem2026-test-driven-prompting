export type CodeBLEUOptions = {
	referenceCode: string
	hypothesisCode: string
}

export type CodeBLEURawInput = {
	ref: string
	hyp: string
}

export type CodeBLEURawResultSuccess = {
	/**
	 * The final aggregated CodeBLEU score (0–1).
	 * This is a weighted combination of n-gram, syntax, and dataflow similarity.
	 */
	codebleu: number

	/**
	 * Standard n-gram BLEU score measuring surface-level text similarity
	 * between the candidate and reference code.
	 */
	ngram_match_score: number

	/**
	 * Weighted n-gram match that penalizes or rewards tokens according to
	 * language-specific keyword importance.
	 * More semantically meaningful than the raw n-gram score.
	 */
	weighted_ngram_match_score: number

	/**
	 * Syntax similarity score based on the structure of the abstract syntax tree (AST).
	 * Measures how similar the_candidate’s parsed code structure is to the reference.
	 */
	syntax_match_score: number

	/**
	 * Dataflow similarity score representing whether the variables,
	 * dependencies, and logical flow of the code match between reference and candidate.
	 * Measures deeper semantic correctness beyond syntax.
	 */
	dataflow_match_score: number
}

export type CodeBLEURawResultFailure = {
	error: string
}

export type CodeBLEURawResult = {
	success?: CodeBLEURawResultSuccess
	failure?: CodeBLEURawResultFailure
}

export type CodeBLEUFormattedResult = {
	codebleuScore: CodeBLEURawResultSuccess["codebleu"]
	ngramMatchScore: CodeBLEURawResultSuccess["ngram_match_score"]
	weightedNgramScore: CodeBLEURawResultSuccess["weighted_ngram_match_score"]
	syntaxMatchScore: CodeBLEURawResultSuccess["syntax_match_score"]
	dataflowMatchScore: CodeBLEURawResultSuccess["dataflow_match_score"]
}
