import { ArrowFunction, CallExpression, FunctionExpression, Node } from "ts-morph"

export type ExecuteOptions = {
	resolvedTestFilePath: string
}

export type SeparatedCallExpressions = {
	expectCallExpressions: CallExpression[]
	methodCallExpressions: CallExpression[]
}

export type TestCallback = ArrowFunction | FunctionExpression

export type HeuristicHandlerFnOptions = {
	methodCallExpression: CallExpression,
	expectCallExpressions: CallExpression[]
	callbackBody: Node
}

export interface DataFlowHeuristicFlags {
	directExpectUse: boolean
	variablePropagation: boolean
	exceptionFlow: boolean
	controlFlowInfluence: boolean
	targetObjectMutation: boolean
}

export interface TestCaseDataFlowResult {
	testCaseName: string
	heuristics: DataFlowHeuristicFlags
}

export type DataFlowAnalysisResult = TestCaseDataFlowResult[]
