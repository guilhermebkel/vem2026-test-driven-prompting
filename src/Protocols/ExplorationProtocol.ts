import { ExploreMethodOptions, ExploreMethodResult } from "@/Protocols/MethodExplorerProtocol"
import { ExploreContextOptions, ExploreContextResult } from "@/Protocols/MethodContextExplorerProtocol"

export type MethodExplorationOptions = {
	exploreOptions: ExploreMethodOptions
}

export type MethodExplorationResult = {
	exploreResult: ExploreMethodResult
}

export type MethodContextExplorationOptions = {
	exploreOptions: ExploreContextOptions
}

export type MethodContextExplorationResult = {
	exploreResult: ExploreContextResult
}
