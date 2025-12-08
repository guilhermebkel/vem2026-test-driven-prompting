export type ProcessOptions<Item> = {
	items: Item[]
	batchSize: number
	handlerFn: (item: Item, state: { current: number, total: number }) => Promise<void>
}

export type BatchAccumulatorProcessor<Item, Result> = (item: Item) => Promise<Result>

export type GetBatchAccumulatorProcessor<Item, Result> = {
	maxWaitingTimeInMilliseconds?: number
	maxAccumulatedCount?: number
	groupBy?: keyof Item
	onItemBatchProcess: (data: Array<{ id: string, item: Item }>) => Promise<BatchAccumulatorProcessorEnrichedResult<Result>[]>
}

export type BatchAccumulatorProcessorEnrichedItem<Item, Result> = {
	id: string
	item: Item
	resolve: (value: Result) => void
	reject: (reason: string) => void
}

export type BatchAccumulatorProcessorEnrichedResult<Result> = {
	id: string
	result: Result
}
