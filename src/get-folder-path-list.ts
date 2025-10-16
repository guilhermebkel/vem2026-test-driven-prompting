import path from "path"
import fs from "fs/promises"

export const getFolderPathList = async (dir: string): Promise<string[]> => {
	let results: string[] = []

	const entries = await fs.readdir(dir, { withFileTypes: true })

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name)

		if (entry.isDirectory()) {
			results = results.concat(await getFolderPathList(fullPath))
		} else {
			results.push(fullPath)
		}
	}

	return results
}
