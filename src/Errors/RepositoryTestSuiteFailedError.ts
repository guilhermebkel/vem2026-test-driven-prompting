class RepositoryTestSuiteFailedError extends Error {
	constructor() {
		super("Tests failed for the method body reconstructed by the LLM.")

		this.name = "RepositoryTestSuiteFailedError"
	}
}

export default RepositoryTestSuiteFailedError
