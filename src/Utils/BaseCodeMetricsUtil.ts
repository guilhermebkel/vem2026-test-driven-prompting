import path from "path"

import { CodeMetricsInput, CodeMetricsResult, ComputeCodeMetricsOptions, Config } from "@/Protocols/CodeMetricsProtocol"

import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import IdentificationUtil from "@/Utils/IdentificationUtil"
import FileUtil from "@/Utils/FileUtil"

abstract class BaseCodeMetricsUtil<FormattedMetrics, RawMetrics> {
	private readonly computeInBatch = DataProcessUtil.getBatchAccumulatorProcessor<ComputeCodeMetricsOptions, CodeMetricsResult<RawMetrics>>({
		maxAccumulatedCount: this.config.batch.maxAccumulatedCount,
		maxWaitingTimeInMilliseconds: this.config.batch.maxWaitingTimeInMilliseconds,
		onItemBatchProcess: async (data) => {
			const batchInput: CodeMetricsInput[] = data.map(pair => ({
				ref: pair.item.referenceCode,
				hyp: pair.item.hypothesisCode
			}))

			const batchResult = await this.callCodeMetricsScript(batchInput)

			return data.map(({ id }, index) => ({
				id: id,
				result: batchResult.at(index) as CodeMetricsResult<RawMetrics>
			}))
		}
	})

	async compute(options: ComputeCodeMetricsOptions): Promise<FormattedMetrics> {
		const result = await this.computeInBatch(options)

		return this.formatRawMetrics(result.success as RawMetrics)
	}

	private async callCodeMetricsScript(batchInput: CodeMetricsInput[]): Promise<CodeMetricsResult<RawMetrics>[]> {
		/**
		 * WARNING:
		 * - Always provide a file as input for the CodeBLEU script. Individual input can be very large,
		 * and passing them directly as command-line arguments may exceed system limits and cause the process to fail (e.g., spawn E2BIG error).
		 */
		const tempDirectoryPath = PathUtil.getTempDirectoryPath()
		const batchInputFilePath = path.join(tempDirectoryPath, `${IdentificationUtil.generateUUID()}.json`)
		const batchInputInJsonString = JSON.stringify(batchInput)
		await FileUtil.setFileContent(batchInputFilePath, batchInputInJsonString)

		const {
			scriptArguments,
			scriptEnvironmentVariables,
			scriptFileName
		} = this.config.shell

		const result = await ShellUtil.executeCommand(`python3 ${scriptFileName} --pairs-file '${batchInputFilePath}' ${scriptArguments}`, {
			currentWorkingDirectoryPath: PathUtil.getScriptsDirectoryPath(),
			environmentVariables: scriptEnvironmentVariables
		})

		await FileUtil.deleteFile(batchInputFilePath)

		const batchResult: CodeMetricsResult<RawMetrics>[] = JSON.parse(result)

		return batchResult
	}

	private get config(): Config {
		return this.getConfig()
	}

	protected abstract formatRawMetrics(rawMetrics: RawMetrics): FormattedMetrics

	protected abstract getConfig(): Config
}

export default BaseCodeMetricsUtil
