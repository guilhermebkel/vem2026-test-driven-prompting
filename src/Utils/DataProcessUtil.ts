import { ProcessOptions } from "@/Protocols/DataProcessProtocol"

class DataProcessUtil {
	async process<Item>(options: ProcessOptions<Item>): Promise<void> {
		const {
			batchSize,
			handlerFn,
			items
		} = options

		let processingCount = 0

		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize)

			await Promise.all(
				batch.map(async (item) => {
					processingCount++
					await handlerFn(item, { current: processingCount, total: items.length })
				})
			)
		}
	}
}

export default new DataProcessUtil()
