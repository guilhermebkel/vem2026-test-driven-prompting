import { Project, SourceFile, Node } from "ts-morph"

import { ExtractionRule, NodeType } from "@/Protocols/NodeJSCodeParserProtocol"

class NodeJSCodeParserUtil {
	private readonly project = new Project({
		compilerOptions: {
			allowJs: true
		},
		skipAddingFilesFromTsConfig: true
	})

	extractSpecificCodeFromSourceFile(filePath: string, extractionRules: ExtractionRule[]): string {
		const sourceFile = this.project.addSourceFileAtPath(filePath)

		const extractedNodes = this.extractNodes(sourceFile, extractionRules)

		const extractedCode = extractedNodes.map(node => node.getText()).join("\n\n")

		return extractedCode
	}

	replaceSpecificCodeInSourceFile(filePath: string, extractionRule: ExtractionRule, changedCode: string): string {
		const changedCodeSourceFile = this.project.createSourceFile(`${Date.now().toString()}.ts`, changedCode)
		const [changedNode] = this.extractNodes(changedCodeSourceFile, [extractionRule])

		const originalSourceFile = this.project.addSourceFileAtPath(filePath)
		const [originalNode] = this.extractNodes(originalSourceFile, [extractionRule])

		originalNode.replaceWithText(`${Node.isExportable(originalNode) ? "export " : ""}${changedNode.getText()}`)

		const sourceCodeWithChanges = originalSourceFile.getText()

		this.project.removeSourceFile(changedCodeSourceFile)
		this.project.removeSourceFile(originalSourceFile)

		return sourceCodeWithChanges
	}

	private extractNodes(sourceFile: SourceFile, extractionRules: ExtractionRule[]): NodeType[] {
		const ruleKindToNodeExtractorFn: Record<ExtractionRule["kind"], (rule: ExtractionRule) => Array<NodeType | undefined>> = {
			class: (rule) => rule.name ? (
				[sourceFile.getClass(rule.name)]
			) : (
				sourceFile.getClasses()
			),
			interface: (rule) => rule.name ? (
				[sourceFile.getInterface(rule.name)]
			) : (
				sourceFile.getInterfaces()
			),
			type: (rule) => rule.name ? (
				[sourceFile.getTypeAlias(rule.name)]
			) : (
				sourceFile.getTypeAliases()
			),
			function: (rule) => rule.name ? (
				[sourceFile.getFunction(rule.name)]
			) : (
				sourceFile.getFunctions()
			),
			method: (rule) => (
				sourceFile.getClasses().flatMap(cls => {
					if (rule.name) {
						return [cls.getMethod(rule.name)]
					}

					return cls.getMethods()
				})
			)
		}

		const extractedNodes: NodeType[] = extractionRules.flatMap(rule => (
			ruleKindToNodeExtractorFn[rule.kind](rule).filter((node): node is NodeType => node !== undefined)
		))

		return extractedNodes || []
	}
}

export default new NodeJSCodeParserUtil()
