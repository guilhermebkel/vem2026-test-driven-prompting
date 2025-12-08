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

	get(key: string): Model | undefined {
		return this.cache.get(key)
	}

	set(key: string, model: Model): void {
		this.cache.set(key, model)
	}

	cachefy(key: string, getFreshData: () => Model): Model {
		let cachedData = this.get(key)

		const isInvalidCache = cachedData === undefined || cachedData === null

		if (isInvalidCache) {
			cachedData = getFreshData()

			this.set(key, cachedData)
		}

		return cachedData as Model
	}
}

export default InMemoryCacheUtil
