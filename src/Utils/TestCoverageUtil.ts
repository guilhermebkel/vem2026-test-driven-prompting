import { NodeType } from "@/Protocols/NodeJSCodeParserProtocol"
import { MethodTestCoverageDetails } from "@/Protocols/TestCoverageProtocol"
import { CoverageReport, FileCoverageInfo } from "@/Protocols/TestExecutorProtocol"

class TestCoverageUtil {
	getMethodTestCoverageDetails(methodNode: NodeType, coverageReport: CoverageReport): MethodTestCoverageDetails {
		const methodFilePath = methodNode.getSourceFile().getFilePath()
		const fileCoverageInfo = coverageReport[methodFilePath]

		if (!fileCoverageInfo) {
			return {
				statementCoveragePercentage: 0,
				lineCoveragePercentage: 0,
				branchCoveragePercentage: 0
			}
		}

		return {
			statementCoveragePercentage: this.calculateStatementCoveragePercentage(methodNode, fileCoverageInfo),
			lineCoveragePercentage: this.calculateLineCoveragePercentage(methodNode, fileCoverageInfo),
			branchCoveragePercentage: this.calculateBranchCoveragePercentage(methodNode, fileCoverageInfo)
		}
	}

	private calculateStatementCoveragePercentage(methodNode: NodeType, fileCoverageInfo: FileCoverageInfo): number {
		const methodStartLine = methodNode.getStartLineNumber()
		const methodEndLine = methodNode.getEndLineNumber()

		let totalStatements = 0
		let coveredStatements = 0

		for (const [stmtId, statementLocation] of Object.entries(fileCoverageInfo.statementMap)) {
			if (
				statementLocation.start.line >= methodStartLine &&
				statementLocation.end.line <= methodEndLine
			) {
				totalStatements++

				if ((fileCoverageInfo.s[stmtId] ?? 0) > 0) {
					coveredStatements++
				}
			}
		}

		if (totalStatements === 0) {
			return 0
		}

		const statementCoveragePercentage = Number(((coveredStatements / totalStatements) * 100).toFixed(2))

		return statementCoveragePercentage
	}

	private calculateLineCoveragePercentage(methodNode: NodeType, fileCoverageInfo: FileCoverageInfo): number {
		const methodStartLine = methodNode.getStartLineNumber()
		const methodEndLine = methodNode.getEndLineNumber()

		const allLinesInMethod = new Set<number>()
		const coveredLines = new Set<number>()

		for (const [stmtId, statementLocation] of Object.entries(fileCoverageInfo.statementMap)) {
			if (
				statementLocation.start.line >= methodStartLine &&
				statementLocation.end.line <= methodEndLine
			) {
				for (let line = statementLocation.start.line; line <= statementLocation.end.line; line++) {
					allLinesInMethod.add(line)

					if ((fileCoverageInfo.s[stmtId] ?? 0) > 0) {
						coveredLines.add(line)
					}
				}
			}
		}

		if (allLinesInMethod.size === 0) {
			return 0
		}

		const lineCoveragePercentage = Number(((coveredLines.size / allLinesInMethod.size) * 100).toFixed(2))

		return lineCoveragePercentage
	}

	private calculateBranchCoveragePercentage(methodNode: NodeType, fileCoverageInfo: FileCoverageInfo): number {
		const methodStartLine = methodNode.getStartLineNumber()
		const methodEndLine = methodNode.getEndLineNumber()

		let totalBranches = 0
		let coveredBranches = 0

		for (const [branchId, branchInfo] of Object.entries(fileCoverageInfo.branchMap)) {
			if (branchInfo.line >= methodStartLine && branchInfo.line <= methodEndLine) {
				const executions = fileCoverageInfo.b[branchId] ?? []
				totalBranches += executions.length
				coveredBranches += executions.filter((count) => count > 0).length
			}
		}

		if (totalBranches === 0) {
			return 0
		}

		const branchCoveragePercentage = Number(((coveredBranches / totalBranches) * 100).toFixed(2))

		return branchCoveragePercentage
	}
}

export default new TestCoverageUtil()
