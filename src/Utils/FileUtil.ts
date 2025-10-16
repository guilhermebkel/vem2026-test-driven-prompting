import fs from "fs/promises"
import path from "path"

class FileUtil {
	async getFileContent(filePath: string): Promise<string> {
		const fileContent = await fs.readFile(filePath, "utf-8")

		return fileContent
	}

	async getFolderPathList(dir: string): Promise<string[]> {
		let results: string[] = []

		const entries = await fs.readdir(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)

			if (entry.isDirectory()) {
				results = results.concat(await this.getFolderPathList(fullPath))
			} else {
				results.push(fullPath)
			}
		}

		return results
	}
}

export default new FileUtil()
