import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { StrykerOptions } from "@stryker-mutator/api/core"

import ShellUtil from "@/Utils/ShellUtil"

import { MutationExecutionOptions, StrykerMutationReport, MutationTestStrength, SetupStrykerConfigOptions } from "@/Protocols/MutationExecuterProtocol"

class MutationExecutorUtil {
	async run(options: MutationExecutionOptions): Promise<MutationTestStrength[]> {
		const { repositoryRootPath, targetFileResolvedPaths, testRunner } = options

		const clonedRepositoryRootPath = await this.cloneRepository(repositoryRootPath)

		try {
			const clonedTargetFileResolvedPaths = targetFileResolvedPaths.map(targetFileResolvedPath => (
				targetFileResolvedPath.replace(repositoryRootPath, clonedRepositoryRootPath)
			))

			await this.setupStrykerConfig({
				repositoryRootPath: clonedRepositoryRootPath,
				targetFileResolvedPaths: clonedTargetFileResolvedPaths,
				testRunner
			})

			await this.executeStryker(clonedRepositoryRootPath)

			const strykerMutationReport = await this.readStrykerMutationReport(clonedRepositoryRootPath)

			return this.extractTestsStrengthFromStrykerMutationReport(strykerMutationReport)
		} finally {
			await this.removeClonedRepository(clonedRepositoryRootPath)
		}
	}

	private async setupStrykerConfig(options: SetupStrykerConfigOptions): Promise<void> {
		const config: Partial<StrykerOptions> = {
			...this.defaultStrykerOptions,
			mutate: options.targetFileResolvedPaths,
			testRunner: options.testRunner
		}

		const STRYKER_CONFIG_FILE_NAME = "stryker.conf.json"
		const tempConfigFilePath = path.join(options.repositoryRootPath, STRYKER_CONFIG_FILE_NAME)

		await fs.writeFile(tempConfigFilePath, JSON.stringify(config, null, 2))
	}

	private async executeStryker(repositoryRootPath: string): Promise<void> {
		await this.ensureMutationDependencies(repositoryRootPath)

		await ShellUtil.executeCommand("./node_modules/.bin/stryker run", {
			currentWorkingDirectoryPath: repositoryRootPath
		})
	}

	private async readStrykerMutationReport(repositoryRootPath: string): Promise<StrykerMutationReport> {
		const reportPath = path.join(repositoryRootPath, this.defaultStrykerOptions.jsonReporter!.fileName)

		const content = await fs.readFile(reportPath, "utf-8")

		return JSON.parse(content)
	}

	private extractTestsStrengthFromStrykerMutationReport(report: StrykerMutationReport): MutationTestStrength[] {
		if (!report?.files) {
			return []
		}

		return Object.entries(report.files).map(([relativeFilePath, fileData]) => {
			const testMap: Record<string, number> = {}

			for (const mutant of fileData.mutants || []) {
				if (mutant.status === "Killed" && mutant.killedBy?.length) {
					for (const testName of mutant.killedBy) {
						testMap[testName] = (testMap[testName] || 0) + 1
					}
				}
			}

			const results = Object.entries(testMap).map(([testName, count]) => ({
				testName,
				killedMutantsCount: count
			}))

			return {
				targetFileRelativePath: relativeFilePath,
				results
			}
		})
	}

	private async ensureMutationDependencies(repositoryRootPath: string): Promise<void> {
		const requiredDeps: string[] = [
			"vitest",
			"typescript",
			"@stryker-mutator/core@9.5.1",
			"@stryker-mutator/vitest-runner@9.5.1"
		]

		const missingDependencies = requiredDeps.filter(dependency => {
			const dependencyExists = existsSync(path.join(repositoryRootPath, "node_modules", dependency))

			return !dependencyExists
		})

		if (missingDependencies.length > 0) {
			await ShellUtil.executeCommand(`pnpm install -D -w ${requiredDeps.join(" ")}`, {
				currentWorkingDirectoryPath: repositoryRootPath
			})
		}
	}

	private async cloneRepository(repositoryRootPath: string): Promise<string> {
		const clonedPath = `${repositoryRootPath}-mutation-${Date.now()}`

		await ShellUtil.executeCommand(`cp -R ${repositoryRootPath} ${clonedPath}`)

		const clonedGitFilePath = path.join(clonedPath, ".git")
		await fs.rm(clonedGitFilePath, { recursive: true, force: true })

		return clonedPath
	}

	private async removeClonedRepository(clonedRepositoryRootPath: string): Promise<void> {
		await fs.rm(clonedRepositoryRootPath, { recursive: true, force: true })
	}

	private get defaultStrykerOptions(): Partial<StrykerOptions> {
		return {
			plugins: [
				"@stryker-mutator/vitest-runner"
			],
			coverageAnalysis: "perTest",
			reporters: ["json"],
			jsonReporter: {
				fileName: "reports/mutation/mutation.json"
			},
			tempDirName: ".stryker-tmp"
		}
	}
}

export default new MutationExecutorUtil()