import fs from "fs/promises"
import path from "path"

class FileUtil {
	async getFileContent(filePath: string): Promise<string> {
		const fileContent = await fs.readFile(filePath, "utf-8")

		return fileContent
	}

	async setFileContent(filePath: string, content: string): Promise<void> {
		await fs.writeFile(filePath, content, "utf-8")
	}

	async getFolderPathList(directoryPath: string): Promise<string[]> {
		let folderPathList: string[] = []

		const entries = await fs.readdir(directoryPath, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(directoryPath, entry.name)

			if (entry.isDirectory()) {
				const recursiveFolderPathList = await this.getFolderPathList(fullPath)
				folderPathList = folderPathList.concat(recursiveFolderPathList)
			} else {
				folderPathList.push(fullPath)
			}
		}

		return folderPathList
	}
}

export default new FileUtil()
