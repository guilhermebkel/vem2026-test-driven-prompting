export type PipelineType =
	"method-reconstruction-experiment" |
	"method-exploration" |
	"method-context-exploration" |
	"prototype"

export type ParsedProcessArguments = {
	pipeline: PipelineType
}
