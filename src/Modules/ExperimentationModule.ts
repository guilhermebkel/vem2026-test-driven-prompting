import {
	MethodReconstructionExperimentationOptions,
	MethodReconstructionExperimentationResult
} from "@/Protocols/ExperimentationProtocol"

import LogService from "@/Services/LogService"
import MethodReconstructionExperimenterService from "@/Services/MethodReconstructionExperimenterService"

class ExperimentationModule {
	async experimentMethodReconstruction(options: MethodReconstructionExperimentationOptions): Promise<MethodReconstructionExperimentationResult> {
		const experimentResult = await MethodReconstructionExperimenterService.experiment(options.experimentOptions)

		const methodExplorationResult: MethodReconstructionExperimentationResult = {
			experimentResult
		}

		await LogService.saveMethodReconstructionExperimentLogs(options, methodExplorationResult)

		return methodExplorationResult
	}
}

export default new ExperimentationModule()
