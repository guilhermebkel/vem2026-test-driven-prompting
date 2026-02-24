import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import { existsSync } from "fs"
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

const STRYKER_CONFIG_FILE_NAME = "stryker.conf.json"

const STRYKER_TEMP_DIR_NAME = ".stryker-tmp"

class MutationExecutorUtil {
	async run(options: MutationExecutionOptions): Promise<MutationTestStrength[]> {
		const { repositoryRootPath, targetFilePath, testRunner } = options

		const tempConfigFilePath = path.join(repositoryRootPath, STRYKER_CONFIG_FILE_NAME)

		await this.generateTempConfig({
			configPath: tempConfigFilePath,
			targetFilePath,
			testRunner
		})

		await this.executeStryker(repositoryRootPath)

		const report = await this.readMutationReport(repositoryRootPath)

		await fs.unlink(tempConfigFilePath).catch(() => { })

		const tempDirPath = path.join(repositoryRootPath, STRYKER_TEMP_DIR_NAME)
		await fs.unlink(tempDirPath).catch(() => { })

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
			tempDirName: STRYKER_TEMP_DIR_NAME
		}

		await fs.writeFile(configPath, JSON.stringify(config, null, 2))
	}

	private async executeStryker(repoRoot: string): Promise<void> {
		await this.ensureMutationDependencies(repoRoot)

		await execAsync(
			"./node_modules/.bin/stryker run",
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

	private hasLocalDependency(repoRoot: string, pkg: string): boolean {
		return existsSync(
			path.join(repoRoot, "node_modules", pkg)
		)
	}

	private async ensureMutationDependencies(repoRoot: string): Promise<void> {
		const requiredDeps = [
			"vitest",
			"typescript",
			"@stryker-mutator/core@9.5.1",
			"@stryker-mutator/vitest-runner@9.5.1"
		]

		const missingDepds = requiredDeps.filter(
			dep => !this.hasLocalDependency(repoRoot, dep)
		)

		if (missingDepds.length > 0) {
			await execAsync(
				`pnpm install -D -w ${requiredDeps.join(" ")}`,
				{ cwd: repoRoot }
			)
		}
	}
}

export default new MutationExecutorUtil()