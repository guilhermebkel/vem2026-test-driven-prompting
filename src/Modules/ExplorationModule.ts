import MethodExplorerService from "@/Services/MethodExplorerService"

import { MethodExplorationOptions } from "@/Protocols/ExplorationProtocol"

class ExplorationModule {
	async exploreMethods(options: MethodExplorationOptions): Promise<void> {
		await MethodExplorerService.explore({
			repositoryName: options.repositoryName,
			methodFilePatterns: options.methodFilePatterns,
			testFilePatterns: options.testFilePatterns
		})
	}
}

export default new ExplorationModule()
