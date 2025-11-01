export type ProcessOptions<Item> = {
	items: Item[]
	batchSize: number
	handlerFn: (item: Item, state: { current: number, total: number }) => Promise<void>
}
