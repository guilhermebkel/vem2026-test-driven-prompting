import {
	MethodReconstructionExperimentationOptions
} from "@/Protocols/ExperimentationProtocol"

import LogService from "@/Services/LogService"
import MethodReconstructionExperimenterService from "@/Services/MethodReconstructionExperimenterService"

class ExperimentationModule {
	async experimentMethodReconstruction(options: MethodReconstructionExperimentationOptions): Promise<void> {
		await MethodReconstructionExperimenterService.experiment(options.experimentOptions, async (result) => {
			await LogService.saveMethodReconstructionExperimentLogs(options, { experimentResult: [result] })
		})
	}
}

export default new ExperimentationModule()
