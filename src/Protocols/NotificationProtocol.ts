export type TaskConfig = {
	setError: (error: Error) => void
	setOutput: (output: string) => void
	setStatus: (status: string) => void
	setWarning: (warning: string) => void
	setTitle: (title: string) => void
}

export type TaskCallback<Result> = (config: TaskConfig) => Promise<Result>
