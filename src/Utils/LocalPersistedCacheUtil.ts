import fs from "fs"
import path from "path"

import { ConstructorOptions } from "@/Protocols/LocalPersistedCacheProtocol"

import HashUtil from "@/Utils/HashUtil"
import PathUtil from "@/Utils/PathUtil"

class LocalPersistedCacheUtil<Model> {
	private readonly cachesDirectory: string

	constructor(options: ConstructorOptions) {
		this.cachesDirectory = path.join(PathUtil.getCachesDirectoryPath(), options.namespace)

		if (!fs.existsSync(this.cachesDirectory)) {
			fs.mkdirSync(this.cachesDirectory, { recursive: true })
		}
	}

	async get(key: unknown): Promise<Model | undefined> {
		const cacheFilePath = this.getCacheFilePath(key)

		if (!fs.existsSync(cacheFilePath)) {
			return undefined
		}

		const rawModel = fs.readFileSync(cacheFilePath, "utf-8")

		return JSON.parse(rawModel) as Model
	}

	async set(key: unknown, model: Model): Promise<void> {
		const cacheFilePath = this.getCacheFilePath(key)

		fs.writeFileSync(cacheFilePath, JSON.stringify(model), "utf-8")
	}

	async cachefy(key: unknown, getFreshData: () => Promise<Model>): Promise<Model> {
		let cachedData = await this.get(key)

		const isInvalidCache = cachedData === undefined || cachedData === null

		if (isInvalidCache) {
			cachedData = await getFreshData()
			await this.set(key, cachedData)
		}

		return cachedData as Model
	}

	private getCacheFilePath(key: unknown): string {
		const keyHash = HashUtil.turnIntoSHA1(key)

		return path.join(this.cachesDirectory, `${keyHash}.json`)
	}
}

export default LocalPersistedCacheUtil