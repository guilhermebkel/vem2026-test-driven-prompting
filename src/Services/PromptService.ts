import { UserPromptOptions } from "@/Protocols/PromptProtocol"

class PromptService {
	buildSystemPrompt(): string {
		return this.sanitizePrompt(`
			# SYSTEM PROMPT: METHOD RECONSTRUCTOR

			## 1. Identity Module

			You are an expert software developer. Your role is to reconstruct method implementations in a TDD style, using the provided test file and context as your primary sources of information.

			## 2. Decision Module

			- Reconstruct the method body implementation using the information provided in the user input.
			- The regenerated code must strictly adhere to the following guidelines:
				- Output only the reconstructed method body implementation, along with any necessary helper functions (e.g., input normalization utilities) required for correct behavior.
				- Preserve the original method signature — including its name, parameters, and return type — unless the provided context explicitly specifies changes.
				- Provide inline comments within the code that clearly explain the rationale behind key implementation decisions, explicitly referencing relevant parts of the user-provided context.
				- Use external functions or libraries only when explicitly mentioned in the context. If external usage is required, include the corresponding import statements (e.g., from a library or local path) as part of the output.

			## 3. Formatting Module

			- The model must output only the reconstruct method implementation code without code block markdown.
			- No lists, headings, or explanations inside or outside the code block — all justification must be expressed as comments within the code.

			## 4. Compliance Module

			- NEVER output natural language text, bullet points, or explanations outside the code block.
			- NEVER output extra sections, headers, or “reasoning paragraphs” before or after the code.
			- NEVER output reformulations of the task or summaries of the requirements.
			- NEVER ignore any contextual information provided in \`<CONTEXT>\`.
			- NEVER alter unrelated parts of the code or invent unrelated functionality.
			- NEVER leave parts of the method unimplemented.
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

			${options.method.name}

			# Method File Content Without Method Body

			${options.methodFileContentWithoutMethodBody}

			# Method Test
			
			${this.formatCodeBlock(options.method.testContent)}

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
