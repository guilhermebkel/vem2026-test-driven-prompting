class DataNotFoundError extends Error {
	constructor(message: string) {
		super(message)

		this.name = "DataNotFoundError"
	}
}

export default DataNotFoundError
