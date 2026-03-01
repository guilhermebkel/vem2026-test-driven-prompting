import { CallExpression, Node, SyntaxKind, IfStatement } from "ts-morph"

import {
	DataFlowAnalysisResult,
	DataFlowHeuristicFlags,
	ExecuteOptions,
	HeuristicHandlerFnOptions,
	SeparatedCallExpressions,
	TestCallback
} from "@/Protocols/TestDataFlowRelevanceProtocol"

import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import SanitizationUtil from "@/Utils/SanitizationUtil"

class TestDataFlowRelevanceUtil {
	async execute(options: ExecuteOptions): Promise<DataFlowAnalysisResult> {
		const project = NodeJSCodeParserUtil.createProject()
		const sourceFile = project.addSourceFileAtPath(options.resolvedTestFilePath)

		const testCaseNodes = NodeJSCodeParserUtil.extractNodes(sourceFile, [{ type: "test-case" }])

		return testCaseNodes.reduce<DataFlowAnalysisResult>((results, testCaseNode) => {
			const testCaseName = SanitizationUtil.extractTestCaseName(testCaseNode)

			if (!testCaseName) {
				return results
			}

			const heuristics = this.evaluateHeuristics(testCaseNode)

			results.push({ testCaseName, heuristics })

			return results
		}, [])
	}

	private extractTestCallback(testCaseNode: CallExpression): TestCallback | null {
		const callbackArgument = testCaseNode.getArguments()[1]

		const isValidCallback = callbackArgument && (Node.isArrowFunction(callbackArgument) || Node.isFunctionExpression(callbackArgument))

		return isValidCallback ? callbackArgument : null
	}

	private separateCallExpressions(allCallExpressions: CallExpression[]): SeparatedCallExpressions {
		const methodCallExpressions: CallExpression[] = []
		const expectCallExpressions: CallExpression[] = []

		for (const callExpression of allCallExpressions) {
			const calleeName = callExpression.getExpression().getText()

			if (calleeName === "expect") {
				expectCallExpressions.push(callExpression)
			} else {
				methodCallExpressions.push(callExpression)
			}
		}

		return { methodCallExpressions, expectCallExpressions }
	}

	private textIncludesIdentifier(text: string, identifier: string): boolean {
		const isSimpleIdentifier = /^\w+$/.test(identifier)

		if (isSimpleIdentifier) {
			return new RegExp(`\\b${identifier}\\b`).test(text)
		}

		return text.includes(identifier)
	}

	private evaluateHeuristics(testCaseNode: CallExpression): DataFlowHeuristicFlags {
		const testCallback = this.extractTestCallback(testCaseNode)

		if (!testCallback) {
			return {
				directExpectUse: false,
				variablePropagation: false,
				exceptionFlow: false,
				controlFlowInfluence: false,
				targetObjectMutation: false
			}
		}

		const callbackBody = testCallback.getBody()
		const allCallExpressions = callbackBody.getDescendantsOfKind(SyntaxKind.CallExpression)

		const { methodCallExpressions, expectCallExpressions } = this.separateCallExpressions(allCallExpressions)

		return {
			directExpectUse: methodCallExpressions.some(methodCallExpression => this.isMethodCallDirectlyAsserted({ callbackBody, expectCallExpressions, methodCallExpression })),
			variablePropagation: methodCallExpressions.some(methodCallExpression => this.isMethodCallAssertedViaVariable({ callbackBody, expectCallExpressions, methodCallExpression })),
			exceptionFlow: methodCallExpressions.some(methodCallExpression => this.isMethodCallUsedInToThrow({ callbackBody, expectCallExpressions, methodCallExpression })),
			controlFlowInfluence: methodCallExpressions.some(methodCallExpression => this.isMethodCallControllingExpect({ callbackBody, expectCallExpressions, methodCallExpression })),
			targetObjectMutation: methodCallExpressions.some(methodCallExpression => this.isTargetObjectAssertedInExpect({ callbackBody, expectCallExpressions, methodCallExpression }))
		}
	}

	private isMethodCallDirectlyAsserted(options: HeuristicHandlerFnOptions): boolean {
		const {
			methodCallExpression,
			expectCallExpressions
		} = options

		const methodCallText = methodCallExpression.getText()

		return expectCallExpressions.some(expectCallExpression => {
			const assertedArgument = expectCallExpression.getArguments()[0]
			return assertedArgument && this.textIncludesIdentifier(assertedArgument.getText(), methodCallText)
		})
	}

	private isMethodCallAssertedViaVariable(options: HeuristicHandlerFnOptions): boolean {
		const {
			methodCallExpression,
			expectCallExpressions
		} = options

		const parentNode = methodCallExpression.getParent()

		if (!Node.isVariableDeclaration(parentNode)) {
			return false
		}

		const assignedVariableName = parentNode.getName()

		return expectCallExpressions.some(expectCallExpression => {
			const assertedArgument = expectCallExpression.getArguments()[0]
			return assertedArgument && this.textIncludesIdentifier(assertedArgument.getText(), assignedVariableName)
		})
	}

	private isMethodCallUsedInToThrow(options: HeuristicHandlerFnOptions): boolean {
		const {
			methodCallExpression
		} = options

		const parent = methodCallExpression.getParent()

		if (!Node.isArrowFunction(parent) && !Node.isFunctionExpression(parent)) {
			return false
		}

		const grandParent = parent.getParent()

		if (!Node.isCallExpression(grandParent)) {
			return false
		}

		const expression = grandParent.getExpression()

		return (
			Node.isPropertyAccessExpression(expression) &&
			expression.getName() === "toThrow"
		)
	}

	private isMethodCallControllingExpect(options: HeuristicHandlerFnOptions): boolean {
		const {
			callbackBody,
			methodCallExpression
		} = options

		const ifStatements = callbackBody.getDescendantsOfKind(SyntaxKind.IfStatement)

		return ifStatements.some((ifStatement: IfStatement) => {
			const conditionText = ifStatement.getExpression().getText()

			if (!this.textIncludesIdentifier(conditionText, methodCallExpression.getText())) {
				return false
			}

			const expectsInsideIf = ifStatement
				.getDescendantsOfKind(SyntaxKind.CallExpression)
				.filter(call => call.getExpression().getText() === "expect")

			return expectsInsideIf.length > 0
		})
	}

	private isTargetObjectAssertedInExpect(options: HeuristicHandlerFnOptions): boolean {
		const {
			methodCallExpression,
			expectCallExpressions
		} = options

		const expression = methodCallExpression.getExpression()

		if (!Node.isPropertyAccessExpression(expression)) {
			return false
		}

		const objectName = expression.getExpression().getText()

		return expectCallExpressions.some(expectCallExpression => {
			const assertedArgument = expectCallExpression.getArguments()[0]
			return assertedArgument && this.textIncludesIdentifier(assertedArgument.getText(), objectName)
		})
	}
}

export default new TestDataFlowRelevanceUtil()