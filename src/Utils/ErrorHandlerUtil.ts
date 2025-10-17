class ErrorHandlerUtil {
	handle(error: Error | unknown): void {
		console.error(error)
	}
}

export default new ErrorHandlerUtil()
