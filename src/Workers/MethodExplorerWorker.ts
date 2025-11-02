import micromatch from "micromatch"

import { ExploredMethod, MethodExplorerWorkerOptions, MethodExplorerWorkerResult } from "@/Protocols/MethodExplorerProtocol"
import { CoverageReport } from "@/Protocols/TestExecutorProtocol"
import { NodeType } from "@/Protocols/NodeJSCodeParserProtocol"

import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import PathUtil from "@/Utils/PathUtil"

export default function runExploration(options: MethodExplorerWorkerOptions): MethodExplorerWorkerResult {
	const {
		methodFilePaths,
		testFilePaths,
		testFilePatterns,
		repositoryName,
		testCoverageReport
	} = options

	const exploredMethods: ExploredMethod[] = []

	const project = NodeJSCodeParserUtil.createProject()

	testFilePaths.forEach(testFilePath => {
		const resolvedTestFilePath = PathUtil.resolveRelativeFilePath(repositoryName, testFilePath)
		project.addSourceFileAtPath(resolvedTestFilePath)
	})

	methodFilePaths.forEach(methodFilePath => {
		const resolvedMethodFilePath = PathUtil.resolveRelativeFilePath(repositoryName, methodFilePath)
		const methodSourceFile = project.addSourceFileAtPath(resolvedMethodFilePath)

		const nodes = NodeJSCodeParserUtil.extractNodes(methodSourceFile, [{ type: "class" }, { type: "function" }])

		nodes.forEach(node => {
			const referencedFilePaths = node.findReferencesAsNodes().map(ref => ref.getSourceFile().getFilePath())
			const resolvedTestFilePath = referencedFilePaths.find(refPath => micromatch.isMatch(refPath, testFilePatterns))

			const exploredMethod: ExploredMethod = {
				name: node.getName(),
				declarationType: NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()),
				resolvedMethodFilePath,
				resolvedTestFilePath,
				testCoveragePercentage: getMethodTestCoveragePercentage(node, testCoverageReport)
			}

			exploredMethods.push(exploredMethod)
		})

		project.removeSourceFile(methodSourceFile)
	})

	return exploredMethods
}

function getMethodTestCoveragePercentage(methodNode: NodeType, coverageReport: CoverageReport): number {
	const methodFilePath = methodNode.getSourceFile().getFilePath()
	const methodTestCoverageReport = coverageReport[methodFilePath]

	if (!methodTestCoverageReport) {
		return 0
	}

	const start = methodNode.getStartLineNumber()
	const end = methodNode.getEndLineNumber()

	let covered = 0
	let total = 0

	for (const [stmtId, loc] of Object.entries(methodTestCoverageReport.statementMap)) {
		const executed = methodTestCoverageReport.s[stmtId] ?? 0

		if (loc.start.line >= start && loc.end.line <= end) {
			total++
			if (executed > 0) covered++
		}
	}

	if (total === 0) {
		return 0
	}

	const testCoveragePercentage = (covered / total) * 100

	return Number(testCoveragePercentage.toFixed(2))
}