import PQueue from "p-queue"

class InMemoryQueueUtil {
	private readonly queue: PQueue

	constructor(concurrency: number) {
		this.queue = new PQueue({ concurrency })
	}

	async enqueue<ExpectedResult>(
		fn: () => Promise<ExpectedResult> | ExpectedResult
	): Promise<ExpectedResult> {
		return await this.queue.add(fn)
	}

	async onIdle(): Promise<void> {
		return await this.queue.onIdle()
	}

	async onSlotAvailable(): Promise<void> {
		const isQueueFull = this.queue.size >= this.queue.concurrency

		if (isQueueFull) {
			return await new Promise(resolve => this.queue.on("next", () => resolve()))
		}
	}
}

export default InMemoryQueueUtil
