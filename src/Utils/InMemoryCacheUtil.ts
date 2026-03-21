import NodeCache from "node-cache"

import { ConstructorOptions } from "@/Protocols/InMemoryCacheProtocol"

class InMemoryCacheUtil<Model> {
	private readonly cache: NodeCache

	constructor(options: ConstructorOptions) {
		this.cache = new NodeCache({
			stdTTL: options.defaultExpirationInSeconds,
			checkperiod: options.defaultExpirationInSeconds
		})
	}

	async get(key: string): Promise<Model | undefined> {
		return Promise.resolve(this.cache.get(key))
	}

	async set(key: string, model: Model): Promise<void> {
		this.cache.set(key, model)
	}

	async cachefy(key: string, getFreshData: () => Promise<Model>): Promise<Model> {
		let cachedData = await this.get(key)

		const isInvalidCache = cachedData === undefined || cachedData === null

		if (isInvalidCache) {
			cachedData = await getFreshData()

			await this.set(key, cachedData)
		}

		return cachedData as Model
	}
}

export default InMemoryCacheUtil
