class ReconstructedMethodNotCompilableError extends Error {
	constructor() {
		super("The method body reconstructed by the LLM is not compilable.")

		this.name = "ReconstructedMethodNotCompilableError"
	}
}

export default ReconstructedMethodNotCompilableError
