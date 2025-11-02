class PromptUtil {
	formatCodeBlock(blockContent: string): string {
		return `\`\`\`\n${blockContent}\n\`\`\``
	}

	sanitizePrompt(prompt: string): string {
		let sanitizedPrompt: string = prompt

		const trimmedPrompt = sanitizedPrompt.trim()
		sanitizedPrompt = trimmedPrompt

		const promptLines = trimmedPrompt.split("\n")
		const firstIndentedLineIndex = promptLines.findIndex(line => line.startsWith("\t"))
		const isThereAnyIndentation = firstIndentedLineIndex != -1

		if (isThereAnyIndentation) {
			const indentMatch = promptLines[firstIndentedLineIndex]!.match(/^[\t ]*/)
			const indentation = String(indentMatch![0])
			const promptWithoutIndentation = sanitizedPrompt.replace(new RegExp(`^${indentation}`, "gm"), "")

			sanitizedPrompt = promptWithoutIndentation
		}

		return sanitizedPrompt
	}
}

export default new PromptUtil()
