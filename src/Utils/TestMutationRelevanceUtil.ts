import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { StrykerOptions } from "@stryker-mutator/api/core"
import { TestProjectConfiguration, TestUserConfig } from "vitest/config"

import ShellUtil from "@/Utils/ShellUtil"
import LocalPersistedCacheUtil from "@/Utils/LocalPersistedCacheUtil"

import {
	ExecuteOptions,
	StrykerMutationReport,
	MutationTestStrength,
	SetupStrykerOptions,
	TestMutationAnalysisResult,
	TestRunnerType,
	TestRunnerSpecificStrykerConfig
} from "@/Protocols/TestMutationRelevanceProtocol"

class TestMutationRelevanceUtil {
	private cache = new LocalPersistedCacheUtil<TestMutationAnalysisResult>({ namespace: "test-mutation-relevance" })

	async execute(options: ExecuteOptions): Promise<TestMutationAnalysisResult> {
		return await this.cache.cachefy(options, async () => {
			const { repositoryRootPath, targetResolvedFilePaths, customStrykerOptions } = options

			const clonedRepositoryRootPath = await this.cloneRepository(repositoryRootPath)

			try {
				const clonedTargetResolvedFilePaths = targetResolvedFilePaths.map(targetFileResolvedPath => (
					targetFileResolvedPath.replace(repositoryRootPath, clonedRepositoryRootPath)
				))

				await this.setupStryker({
					repositoryRootPath: clonedRepositoryRootPath,
					targetResolvedFilePaths: clonedTargetResolvedFilePaths,
					customStrykerOptions
				})

				await this.executeStryker(clonedRepositoryRootPath)

				const strykerMutationReport = await this.readStrykerMutationReport(clonedRepositoryRootPath)

				return this.extractTestsStrengthFromStrykerMutationReport(repositoryRootPath, strykerMutationReport)
			} finally {
				await this.removeClonedRepository(clonedRepositoryRootPath)
			}
		})
	}

	private async setupStryker(options: SetupStrykerOptions): Promise<void> {
		await this.ensureMutationDependencies(options)

		const vitestWorkspaceConfigFilePath = await this.setupVitestWorkspaceConfig(options)

		const config: Partial<StrykerOptions> = {
			...this.defaultStrykerOptions,
			...options.customStrykerOptions,
			...(vitestWorkspaceConfigFilePath ? { vitest: { configFile: vitestWorkspaceConfigFilePath } } : {}),
			plugins: [
				...this.defaultStrykerOptions.plugins,
				...this.testRunnerTypeToSpecificStrykerConfig[options.customStrykerOptions.testRunner].plugins
			],
			mutate: options.targetResolvedFilePaths
		}

		const STRYKER_CONFIG_FILE_NAME = "stryker.conf.json"
		const tempConfigFilePath = path.join(options.repositoryRootPath, STRYKER_CONFIG_FILE_NAME)

		await fs.writeFile(tempConfigFilePath, JSON.stringify(config, null, 2))
	}

	private async setupVitestWorkspaceConfig(options: SetupStrykerOptions): Promise<string | null> {
		if (options.customStrykerOptions.testRunner !== "vitest") {
			return null
		}

		const findVitestConfigsOutput = await ShellUtil.executeCommand(
			"find . -name \"vitest.config.*\" -not -path \"*/node_modules/*\" -not -path \"*/.stryker*\" -not -path \"*/dist/*\"",
			{ currentWorkingDirectoryPath: options.repositoryRootPath }
		)

		const vitestConfigFilePaths = findVitestConfigsOutput
			.split("\n")
			.map(line => line.trim().replace(/^\.\//, ""))
			.filter(Boolean)
			.filter(configPath => !(options.customStrykerOptions.excludedVitestConfigs || []).some(excluded => configPath.includes(excluded)))

		const isMonorepo = vitestConfigFilePaths.length > 1

		if (!isMonorepo) {
			return null
		}

		const testUserConfig: TestUserConfig = {
			projects: vitestConfigFilePaths.map<TestProjectConfiguration>(vitestConfigFilePath => options.customStrykerOptions?.testTimeoutInMilliseconds ? ({
				extends: vitestConfigFilePath,
				test: {
					testTimeout: options.customStrykerOptions!.testTimeoutInMilliseconds
				}
			}) : (
				vitestConfigFilePath
			))
		}

		const workspaceFileContent = `
			export default {
				test: ${JSON.stringify(testUserConfig)}
			}
		`

		const WORKSPACE_CONFIG_FILE_NAME = "vitest.workspace.stryker.mjs"
		await fs.writeFile(path.join(options.repositoryRootPath, WORKSPACE_CONFIG_FILE_NAME), workspaceFileContent)

		return WORKSPACE_CONFIG_FILE_NAME
	}

	private async executeStryker(repositoryRootPath: string): Promise<void> {
		await ShellUtil.executeCommand("./node_modules/.bin/stryker run --logLevel debug", {
			currentWorkingDirectoryPath: repositoryRootPath
		})
	}

	private async readStrykerMutationReport(repositoryRootPath: string): Promise<StrykerMutationReport> {
		const reportPath = path.join(repositoryRootPath, this.defaultStrykerOptions.jsonReporter.fileName)

		const content = await fs.readFile(reportPath, "utf-8")

		return JSON.parse(content)
	}

	private extractTestsStrengthFromStrykerMutationReport(repositoryRootPath: string, report: StrykerMutationReport): MutationTestStrength[] {
		if (!report?.files) {
			return []
		}

		const testCaseIdToRawTestCaseName: Record<string, string> = {}

		if (report.testFiles) {
			for (const fileData of Object.values(report.testFiles)) {
				for (const test of fileData.tests || []) {
					testCaseIdToRawTestCaseName[test.id] = test.name
				}
			}
		}

		return Object.entries(report.files).map(([relativeFilePath, fileData]) => {
			const rawTestCaseNameToKilledCount: Record<string, number> = {}

			for (const rawTestCaseName of Object.values(testCaseIdToRawTestCaseName)) {
				rawTestCaseNameToKilledCount[rawTestCaseName] = 0
			}

			for (const mutant of fileData.mutants || []) {
				if (mutant.status === "Killed" && mutant.killedBy?.length) {
					for (const testCaseId of mutant.killedBy) {
						const rawTestCaseName = testCaseIdToRawTestCaseName[testCaseId] ?? `Unknown (${testCaseId})`

						rawTestCaseNameToKilledCount[rawTestCaseName] = (rawTestCaseNameToKilledCount[rawTestCaseName] || 0) + 1
					}
				}
			}

			const results = Object.entries(rawTestCaseNameToKilledCount).map(([rawTestCaseName, killedCount]) => ({
				rawTestCaseName,
				killedMutantsCount: killedCount
			}))

			return {
				targetResolvedFilePath: path.join(repositoryRootPath, relativeFilePath),
				results
			}
		})
	}

	private async ensureMutationDependencies(options: SetupStrykerOptions): Promise<void> {
		const requiredDeps: string[] = [
			"typescript",
			"@stryker-mutator/core@9.5.1",
			...this.testRunnerTypeToSpecificStrykerConfig[options.customStrykerOptions.testRunner].requiredDeps
		]

		const missingDependencies = requiredDeps.filter(dependency => {
			const dependencyExists = existsSync(path.join(options.repositoryRootPath, "node_modules", dependency))

			return !dependencyExists
		})

		if (missingDependencies.length > 0) {
			await ShellUtil.executeCommand(`pnpm install -D -w ${requiredDeps.join(" ")}`, {
				currentWorkingDirectoryPath: options.repositoryRootPath
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

	private get defaultStrykerOptions(): Pick<StrykerOptions, "plugins" | "coverageAnalysis" | "reporters" | "jsonReporter" | "tempDirName"> {
		return {
			plugins: [],
			coverageAnalysis: "perTest",
			reporters: ["json"],
			jsonReporter: {
				fileName: "reports/mutation/mutation.json"
			},
			tempDirName: ".stryker-tmp"
		}
	}

	private get testRunnerTypeToSpecificStrykerConfig(): Record<TestRunnerType, TestRunnerSpecificStrykerConfig> {
		return {
			vitest: {
				plugins: ["@stryker-mutator/vitest-runner"],
				requiredDeps: ["vitest", "@stryker-mutator/vitest-runner@9.5.1"]
			},
			jest: {
				plugins: [],
				requiredDeps: []
			}
		}
	}
}

export default new TestMutationRelevanceUtil()