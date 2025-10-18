import { UserPromptOptions } from "@/Protocols/PromptProtocol"

class PromptService {
	buildSystemPrompt(): string {
		return this.sanitizePrompt(`
			# SYSTEM PROMPT: METHOD RECONSTRUCTOR

			## 1. Identity Module

			You are an expert software developer. Your role is to reconstruct method implementations in a TDD style, using only the information provided in the user input (such as test files, surrounding code, or explicit instructions).

			## 2. Decision Module

			- Reconstruct **only the method body implementation** based strictly on the information provided in the user input.
			- The regenerated code must strictly adhere to the following guidelines:
				- If a function, method, or external library is used, it must be explicitly defined or mentioned in the user input.
				- Do **not** rely on prior training knowledge to infer the behavior of undefined functions, methods, or libraries.
				- If the information required to implement a part of the method is not present in the user input, leave a clear inline comment noting the missing context, rather than guessing.
				- Provide inline comments inside the code to explain the rationale behind key implementation decisions, explicitly referencing the relevant parts of the user-provided input.

			## 3. Formatting Module

			- Output **only** the reconstructed method body implementation.
			- Do **not** include any markdown formatting, code block delimiters, lists, or explanations outside the code.
			- All justifications must appear as inline comments inside the code.

			## 4. Compliance Module

			- NEVER output natural language text, bullet points, or explanations outside the code.
			- NEVER output summaries, reformulations, or reasoning paragraphs before or after the code.
			- NEVER alter unrelated parts of the code or invent unrelated functionality.
			- NEVER rely on prior training data to fill in missing logic.
			- NEVER leave parts of the method unimplemented without adding a clear inline comment indicating the missing information.
			- NEVER enclose the output in a Markdown code block.
		`)
	}

	buildUserPrompt(options: UserPromptOptions): string {
		const contextSections = options.buildedContext.map((item) => (
			`## ${item.name}\n\n${this.formatCodeBlock(item.content)}`
		))
		const mergedContextSections = contextSections.join("\n\n")

		return this.sanitizePrompt(`
			# Method Name

			${options.methodName}

			# Method File Content Without Method Body

			${this.formatCodeBlock(options.methodFileContentWithoutMethodBody)}

			# Method Test
			
			${this.formatCodeBlock(options.methodTestContent)}

			# Context

			${mergedContextSections}
		`)
	}

	private formatCodeBlock(blockContent: string): string {
		return `\`\`\`\n${blockContent}\n\`\`\``
	}

	private sanitizePrompt(prompt: string): string {
		let sanitizedPrompt: string = prompt

		const trimmedPrompt = sanitizedPrompt.trim()
		sanitizedPrompt = trimmedPrompt

		const promptLines = trimmedPrompt.split("\n")
		const firstIndentedLineIndex = promptLines.findIndex(line => line.startsWith("\t"))
		const isThereAnyIndentation = firstIndentedLineIndex != -1

		if (isThereAnyIndentation) {
			const indentMatch = promptLines[firstIndentedLineIndex].match(/^[\t ]*/)
			const indentation = String(indentMatch?.[0])
			const promptWithoutIndentation = sanitizedPrompt.replace(new RegExp(`^${indentation}`, "gm"), "")

			sanitizedPrompt = promptWithoutIndentation
		}

		return sanitizedPrompt
	}
}

export default new PromptService()
