export type Config = {
	batch: {
		maxAccumulatedCount: number
		maxWaitingTimeInMilliseconds: number
	}
	shell: {
		scriptFileName: string
		scriptArguments: string
		scriptEnvironmentVariables: Record<string, string>
	}
}

export type ComputeCodeMetricsOptions = {
	referenceCode: string
	hypothesisCode: string
}

export type CodeMetricsInput = {
	ref: string
	hyp: string
}

export type CodeMetricsResult<RawMetrics> = {
	success?: RawMetrics
	failure?: {
		error: string
	}
}
