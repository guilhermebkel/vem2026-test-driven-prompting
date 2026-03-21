import InMemoryQueueUtil from "@/Utils/InMemoryQueueUtil"

class InMemoryMutexUtil {
	private readonly FIFOQueues: Map<string, InMemoryQueueUtil> = new Map()
	private readonly setupFIFOQueue: InMemoryQueueUtil = this.createQueueWithDefaultOptions()

	async execute<ExpectedResult>(
		contextId: string,
		fn: () => Promise<ExpectedResult> | ExpectedResult
	): Promise<ExpectedResult> {
		/**
		 * The queue is created using a FIFO Queue in order to handle
		 * multiple executions of 'enqueue' in the same time in FIFO style.
		 */
		const queue = await this.setupFIFOQueue.enqueue(async () => {
			let queue = this.FIFOQueues.get(contextId)

			if (!queue) {
				queue = this.createQueueWithDefaultOptions()

				this.FIFOQueues.set(contextId, queue)
			}

			return queue
		})

		return await queue.enqueue(fn)
	}

	private createQueueWithDefaultOptions(): InMemoryQueueUtil {
		const defaultConcurrency = 1

		const queue = new InMemoryQueueUtil(defaultConcurrency)

		return queue
	}
}

export default InMemoryMutexUtil
