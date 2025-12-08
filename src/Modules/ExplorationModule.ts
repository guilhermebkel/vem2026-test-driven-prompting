import { MethodContextExplorationOptions, MethodContextExplorationResult, MethodExplorationOptions, MethodExplorationResult } from "@/Protocols/ExplorationProtocol"

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

	async exploreMethodContexts(options: MethodContextExplorationOptions): Promise<MethodContextExplorationResult> {
		const exploreResult = await MethodContextExplorerService.explore(options.exploreOptions)

		const methodExplorationResult: MethodContextExplorationResult = {
			exploreResult
		}

		await LogService.saveMethodContextExplorationLogs(options, methodExplorationResult)

		return methodExplorationResult
	}
}

export default new ExplorationModule()
