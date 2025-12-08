import { MethodContextExplorationOptions, MethodExplorationOptions, MethodExplorationResult } from "@/Protocols/ExplorationProtocol"

import LogService from "@/Services/LogService"
import MethodExplorerService from "@/Services/MethodExplorerService"
import MethodContextExplorerService from "@/Services/MethodContextExplorerService"

class ExplorationModule {
	async exploreMethods(options: MethodExplorationOptions): Promise<MethodExplorationResult> {
		const exploreResult = await MethodExplorerService.explore(options.exploreOptions)

		const methodExplorationResult: MethodExplorationResult = {
			exploreResult
		}

		await LogService.saveMethodExplorationLogs(options, methodExplorationResult)

		return methodExplorationResult
	}

	async exploreMethodContexts(options: MethodContextExplorationOptions): Promise<void> {
		await MethodContextExplorerService.explore(options.exploreOptions)
	}
}

export default new ExplorationModule()
