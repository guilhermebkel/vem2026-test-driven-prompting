import MethodExplorerService from "@/Services/MethodExplorerService"

import { MethodExplorationOptions, MethodExplorationResult } from "@/Protocols/ExplorationProtocol"
import LogService from "@/Services/LogService"

class ExplorationModule {
	async exploreMethods(options: MethodExplorationOptions): Promise<MethodExplorationResult> {
		const exploreResult = await MethodExplorerService.explore({
			repositoryName: options.repositoryName,
			methodFilePatterns: options.methodFilePatterns,
			testFilePatterns: options.testFilePatterns
		})

		const methodExplorationResult: MethodExplorationResult = {
			exploreResult
		}

		await LogService.saveMethodExplorationLogs(options, methodExplorationResult)

		return methodExplorationResult
	}
}

export default new ExplorationModule()
