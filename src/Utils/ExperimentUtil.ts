import path from "path"

import { MethodReconstructionExperimentOptions } from "@/Protocols/ExperimentationProtocol"

class ExperimentUtil {
	getExperimentResultLogFilePath(experimentOptions: MethodReconstructionExperimentOptions, logFileName: string, logFileExtension = ".txt"): string {
		const experimentResultDirectoryPath = this.getExperimentResultDirectoryPath()

		const experimentResultLogFilePath = path.join(experimentResultDirectoryPath, experimentOptions.method.repositoryName, experimentOptions.title, `${logFileName}${logFileExtension}`)

		return experimentResultLogFilePath
	}

	getExperimentResultDirectoryPath(): string {
		const rootDirectoryPath = process.cwd()

		const experimentResultDirectoryPath = path.join(rootDirectoryPath, "experiment-results")

		return experimentResultDirectoryPath
	}
}

export default new ExperimentUtil()
