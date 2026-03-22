import NodeCache from "node-cache"

import { ConstructorOptions } from "@/Protocols/InMemoryCacheProtocol"

import InMemoryMutexUtil from "@/Utils/InMemoryMutexUtil"

class InMemoryCacheUtil<Model> {
	private readonly cache: NodeCache
	private readonly mutex = new InMemoryMutexUtil()

	constructor(options: ConstructorOptions) {
		this.cache = new NodeCache({
			stdTTL: options.defaultExpirationInSeconds,
			checkperiod: options.defaultExpirationInSeconds,
			useClones: false
		})
	}

	async get(key: string): Promise<Model | undefined> {
		return Promise.resolve(this.cache.get(key))
	}

	async set(key: string, model: Model): Promise<void> {
		this.cache.set(key, model)
	}

	async cachefy(key: string, getFreshData: () => Promise<Model>): Promise<Model> {
		return await this.mutex.execute(key, async () => {
			let cachedData = await this.get(key)

			const isInvalidCache = cachedData === undefined || cachedData === null

			if (isInvalidCache) {
				cachedData = await getFreshData()

				await this.set(key, cachedData)
			}

			return cachedData as Model
		})
	}
}

export default InMemoryCacheUtil
