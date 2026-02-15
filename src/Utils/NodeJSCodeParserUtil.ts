import { FunctionDeclaration, MethodDeclaration, Project, SourceFile, SyntaxKind } from "ts-morph"

import { DeclarationType, ExtractionRule, NodeType } from "@/Protocols/NodeJSCodeParserProtocol"

import DataNotFoundError from "@/Errors/DataNotFoundError"
import { OptionalRecord } from "@/Protocols/TypeUtilityProtocol"

class NodeJSCodeParserUtil {
	private readonly project = this.createProject()

	extractSpecificCodeFromSourceFile<DType extends DeclarationType>(filePath: string, extractionRules: ExtractionRule<DType>[]): string {
		const sourceFile = this.project.addSourceFileAtPath(filePath)

		const extractedNodes = this.extractNodes(sourceFile, extractionRules)

		if (!extractedNodes.length) {
			throw new DataNotFoundError("No nodes were found for multiple extraction rules. Please verify that the name and type are correct for each one.")
		}

		const extractedCode = extractedNodes.map(node => node.getText()).join("\n\n")

		this.project.removeSourceFile(sourceFile)

		return extractedCode
	}

	replaceSpecificCodeInSourceFile<DType extends DeclarationType>(filePath: string, extractionRule: ExtractionRule<DType>, changedCode: string): string {
		const originalSourceFile = this.project.addSourceFileAtPath(filePath)
		const [originalNode] = this.extractNodes(originalSourceFile, [extractionRule])

		if (!originalNode) {
			throw new DataNotFoundError(`No node was found for extraction rule "${extractionRule.name}" (${extractionRule.type}). Please verify that the name and type are correct.`)
		}

		originalNode.replaceWithText(changedCode)
		const sourceCodeWithChanges = originalSourceFile.getText()

		this.project.removeSourceFile(originalSourceFile)

		return sourceCodeWithChanges
	}

	removeSpecificMethodOrFunctionBodyInSourceFile<DType extends DeclarationType>(filePath: string, extractionRule: ExtractionRule<DType>): string {
		return this.replaceSpecificMethodOrFunctionBodyInSourceFile(filePath, extractionRule, "")
	}

	replaceSpecificMethodOrFunctionBodyInSourceFile<DType extends DeclarationType>(filePath: string, extractionRule: ExtractionRule<DType>, changedCode: string): string {
		const originalSourceFile = this.project.addSourceFileAtPath(filePath)
		const [originalNode] = this.extractNodes(originalSourceFile, [extractionRule])

		if (!originalNode) {
			throw new DataNotFoundError(`No node was found for extraction rule "${extractionRule.name}" (${extractionRule.type}). Please verify that the name and type are correct.`)
		}

		const isFunctionOrMethod = originalNode instanceof FunctionDeclaration || originalNode instanceof MethodDeclaration

		if (isFunctionOrMethod) {
			originalNode.setBodyText(changedCode)
		} else {
			throw new DataNotFoundError(`No function or method was found for extraction rule "${extractionRule.name}" (${extractionRule.type}). Please verify that the name and type are correct.`)
		}

		const sourceCodeWithChanges = originalSourceFile.getText()

		this.project.removeSourceFile(originalSourceFile)

		return sourceCodeWithChanges
	}

	createProject(): Project {
		return new Project({
			compilerOptions: {
				allowJs: true
			},
			skipAddingFilesFromTsConfig: true
		})
	}

	extractNodes<DType extends DeclarationType>(sourceFile: SourceFile, extractionRules: ExtractionRule<DType>[]): NodeType<DType>[] {
		const ruleKindToNodeExtractorFn: Record<DeclarationType, (rule: ExtractionRule<DType>) => Array<NodeType<DType> | undefined>> = {
			class: (rule) => (
				rule.name ? (
					[sourceFile.getClass(rule.name)]
				) : (
					sourceFile.getClasses()
				)
			) as Array<NodeType<DType>>,
			interface: (rule) => (
				rule.name ? (
					[sourceFile.getInterface(rule.name)]
				) : (
					sourceFile.getInterfaces()
				)
			) as Array<NodeType<DType>>,
			type: (rule) => (
				rule.name ? (
					[sourceFile.getTypeAlias(rule.name)]
				) : (
					sourceFile.getTypeAliases()
				)
			) as Array<NodeType<DType>>,
			function: (rule) => (
				rule.name ? (
					[sourceFile.getFunction(rule.name)]
				) : (
					sourceFile.getFunctions()
				)
			) as Array<NodeType<DType>>,
			method: (rule) => (
				sourceFile.getClasses().flatMap(cls => {
					if (rule.name) {
						return [cls.getMethod(rule.name)]
					}

					return cls.getMethods()
				})
			) as Array<NodeType<DType>>,
			"test-case": (rule) => (
				sourceFile
					.getDescendantsOfKind(SyntaxKind.CallExpression)
					.filter(call => {
						const testNames: string[] = ["it", "test"]

						const expression = call.getExpression()

						let callName: string | undefined

						if (expression.isKind(SyntaxKind.Identifier)) {
							callName = expression.getText()
						} else if (expression.isKind(SyntaxKind.PropertyAccessExpression)) {
							callName = expression.getExpression().getText()
						}

						if (!callName || !testNames.includes(callName)) {
							return false
						}

						if (!rule.name) {
							return true
						}

						const testDescription = call.getArguments()[0]

						if (!testDescription || !testDescription.isKind(SyntaxKind.StringLiteral)) {
							return false
						}

						return testDescription.getLiteralText() === rule.name
					})
			) as Array<NodeType<DType>>
		}

		const extractedNodes: Array<NodeType<DType>> = extractionRules.flatMap(rule => (
			ruleKindToNodeExtractorFn[rule.type](rule).filter((node): node is NodeType<DType> => node !== undefined)
		))

		return extractedNodes || []
	}

	turnSyntaxKindIntoDeclarationType(syntaxKind: SyntaxKind): DeclarationType | undefined {
		const kindNameToDeclarationType: OptionalRecord<SyntaxKind, DeclarationType> = {
			[SyntaxKind.FunctionDeclaration]: "function",
			[SyntaxKind.FunctionExpression]: "function",
			[SyntaxKind.ArrowFunction]: "function",
			[SyntaxKind.MethodDeclaration]: "method",
			[SyntaxKind.Constructor]: "method",
			[SyntaxKind.GetAccessor]: "method",
			[SyntaxKind.SetAccessor]: "method"
		}

		return kindNameToDeclarationType[syntaxKind]
	}
}

export default new NodeJSCodeParserUtil()
