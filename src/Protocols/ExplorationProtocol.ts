import { ExploreOptions, ExploreResult } from "@/Protocols/MethodExplorerProtocol"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"

export type MethodExplorationOptions = {
	repositoryName: RepositoryName
	methodFilePatterns: ExploreOptions["methodFilePatterns"]
	testFilePatterns: ExploreOptions["methodFilePatterns"]
}

export type MethodExplorationResult = {
	exploreResult: ExploreResult
}
