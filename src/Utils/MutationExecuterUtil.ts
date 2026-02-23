import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

type MutationExecutionOptions = {
	repositoryRootPath: string
	targetFilePath: string
	testRunner: "vitest" | "jest"
}

type MutationTestStrength = {
	testName: string
	killedMutantsCount: number
}

type MutationReport = {
	mutants: Array<{
		status: string
		killedBy: string
	}>
}

class MutationExecutorUtil {
	async run(options: MutationExecutionOptions): Promise<MutationTestStrength[]> {
		const { repositoryRootPath, targetFilePath, testRunner } = options

		const tempConfigPath = path.join(
			repositoryRootPath,
			"stryker.temp.config.json"
		)

		await this.generateTempConfig({
			configPath: tempConfigPath,
			targetFilePath,
			testRunner
		})

		await this.executeStryker(repositoryRootPath, tempConfigPath)

		const report = await this.readMutationReport(repositoryRootPath)

		await fs.unlink(tempConfigPath).catch(() => { })

		return this.extractTestStrength(report)
	}

	private async generateTempConfig({
		configPath,
		targetFilePath,
		testRunner
	}: {
		configPath: string
		targetFilePath: string
		testRunner: string
	}): Promise<void> {
		const config = {
			mutate: [targetFilePath],
			testRunner,
			coverageAnalysis: "perTest",
			reporters: ["json"],
			tempDirName: ".stryker-tmp"
		}

		await fs.writeFile(configPath, JSON.stringify(config, null, 2))
	}

	private async executeStryker(repoRoot: string, configPath: string): Promise<void> {
		await execAsync(
			`npx @stryker-mutator/core run --config-file ${configPath}`,
			{ cwd: repoRoot }
		)
	}

	private async readMutationReport(repoRoot: string): Promise<MutationReport> {
		const reportPath = path.join(
			repoRoot,
			"reports/mutation/mutation-report.json"
		)

		const content = await fs.readFile(reportPath, "utf-8")

		return JSON.parse(content)
	}

	private extractTestStrength(report: MutationReport): MutationTestStrength[] {
		const testMap: Record<string, number> = {}

		for (const mutant of report.mutants || []) {
			if (mutant.status === "Killed" && mutant.killedBy?.length) {
				for (const testName of mutant.killedBy) {
					testMap[testName] = (testMap[testName] || 0) + 1
				}
			}
		}

		return Object.entries(testMap).map(([testName, count]) => ({
			testName,
			killedMutantsCount: count
		}))
	}
}

export default new MutationExecutorUtil()