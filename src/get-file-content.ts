import fs from "fs/promises"

export const getFileContent = async (filePath: string): Promise<string> => {
	const fileContent = await fs.readFile(filePath, "utf-8")

	return fileContent
}