import {
	MethodReconstructionExperimentationOptions,
	MethodReconstructionExperimentationResult
} from "@/Protocols/ExperimentationProtocol"

import LogService from "@/Services/LogService"
import MethodReconstructionExperimenterService from "@/Services/MethodReconstructionExperimenterService"

class ExperimentationModule {
	async experimentMethodReconstruction(options: MethodReconstructionExperimentationOptions): Promise<MethodReconstructionExperimentationResult> {
		const experimentResult = await MethodReconstructionExperimenterService.experiment(options.experimentOptions, async (result) => {
			await LogService.saveMethodReconstructionExperimentLogs(options, { experimentResult: [result] })
		})

		const methodExplorationResult: MethodReconstructionExperimentationResult = {
			experimentResult
		}

		return methodExplorationResult
	}
}

export default new ExperimentationModule()
