import { ProcessOptions } from "@/Protocols/DataProcessProtocol"

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
}

export default new DataProcessUtil()
