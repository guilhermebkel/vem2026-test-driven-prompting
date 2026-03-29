import { existsSync } from "fs"
import fs from "fs/promises"
import path from "path"

class FileUtil {
	async getFileContent(filePath: string): Promise<string> {
		const fileContent = await fs.readFile(filePath, "utf-8")

		return fileContent
	}

	async setFileContent(filePath: string, content: string): Promise<void> {
		const fileDirectoryPath = path.dirname(filePath)
		await fs.mkdir(fileDirectoryPath, { recursive: true })

		await fs.writeFile(filePath, content, "utf-8")
	}

	async deleteFile(filePath: string): Promise<void> {
		await fs.rm(filePath)
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

	async appendCSVRow(csvFilePath: string, csvRow: Record<string, string | number | boolean | undefined>): Promise<void> {
		const csvAlreadyExists = existsSync(csvFilePath)

		const csvHeaders = Object.keys(csvRow)

		if (!csvAlreadyExists) {
			const headerRow = csvHeaders.join(",") + "\n"
			await this.setFileContent(csvFilePath, headerRow)
		}

		const mappedCsvRow = csvHeaders.map(header => csvRow[header] ?? "").join(",") + "\n"
		await fs.appendFile(csvFilePath, mappedCsvRow, "utf-8")
	}
}

export default new FileUtil()
