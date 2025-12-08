import { Subject } from "rxjs"
import { bufferTime, groupBy, mergeAll } from "rxjs/operators"

import {
	BatchAccumulatorProcessor,
	BatchAccumulatorProcessorEnrichedItem,
	GetBatchAccumulatorProcessor,
	ProcessOptions
} from "@/Protocols/DataProcessProtocol"

import IdentificationUtil from "@/Utils/IdentificationUtil"

class DataProcessUtil {
	async process<Item>(options: ProcessOptions<Item>): Promise<void> {
		const {
			batchSize,
			handlerFn,
			items
		} = options

		let processingCount = 0

		const chunks = this.splitIntoChunks(items, batchSize)

		for (const chunk of chunks) {
			await Promise.all(
				chunk.map(async (item) => {
					processingCount++
					await handlerFn(item, { current: processingCount, total: items.length })
				})
			)
		}
	}

	splitIntoChunks<Item>(items: Item[], chunkSize: number): Item[][] {
		const chunks: Item[][] = []

		for (let i = 0; i < items.length; i += chunkSize) {
			const chunk = items.slice(i, i + chunkSize)

			chunks.push(chunk)
		}

		return chunks
	}

	getBatchAccumulatorProcessor<Item, Result>(input: GetBatchAccumulatorProcessor<Item, Result>): BatchAccumulatorProcessor<Item, Result> {
		const batchProcessor = new Subject<BatchAccumulatorProcessorEnrichedItem<Item, Result>>()

		batchProcessor.pipe(
			groupBy ? (
				groupBy((enrichedItem: BatchAccumulatorProcessorEnrichedItem<Item, Result>) => enrichedItem.item[input.groupBy as keyof Item]),
				mergeAll(),
				bufferTime(Number(input.maxWaitingTimeInMilliseconds), undefined, Number(input.maxAccumulatedCount))
			) : (
				bufferTime(Number(input.maxWaitingTimeInMilliseconds), undefined, Number(input.maxAccumulatedCount))
			)
		).subscribe(async batchData => {
			if (batchData.length) {
				try {
					const data = batchData.map(data => ({ id: data.id, item: data.item }))

					const results = await input.onItemBatchProcess(data)

					batchData.forEach(data => {
						const result = results.find(result => result.id === data.id)

						data.resolve(result?.result as Result)
					})
				} catch (error) {
					const typedError = error as Error
					batchData.forEach(data => data.reject(typedError.message))
				}
			}
		})

		return async (item) => await new Promise<Result>((resolve, reject) => batchProcessor.next({
			id: IdentificationUtil.generateUUID(),
			item,
			resolve,
			reject
		}))
	}
}

export default new DataProcessUtil()
