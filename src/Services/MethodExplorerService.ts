import glob from "fast-glob"
import micromatch from "micromatch"
import { Project } from "ts-morph"

import { ExploredMethod, ExploreOptions, ExploreResult } from "@/Protocols/MethodExplorerProtocol"

import PathUtil from "@/Utils/PathUtil"
import NodeJSCodeParserUtil from "@/Utils/NodeJSCodeParserUtil"
import TracingUtil from "@/Utils/TracingUtil"
import DataProcessUtil from "@/Utils/DataProcessUtil"
import { RepositoryName } from "@/Protocols/RepositoryProtocol"

class MethodExplorerService {
	async explore(options: ExploreOptions): Promise<ExploreResult> {
		const project = NodeJSCodeParserUtil.createProject()

		const testFilePaths = await this.searchTestFilePaths(options.testFilePatterns, options.repositoryName)

		await this.loadTestFiles(project, testFilePaths, options.repositoryName)

		const methodFilePaths = await this.searchMethodFilePaths(options.methodFilePatterns, options.testFilePatterns, options.repositoryName)

		const exploredMethods = await this.exploreMethodFiles(project, methodFilePaths, options.repositoryName, options.testFilePatterns)

		return exploredMethods
	}

	private async searchTestFilePaths(testFilePatterns: string[], repositoryName: RepositoryName): Promise<string[]> {
		return await TracingUtil.traceTask("Search test file paths...", async (config) => {
			const testFilePaths = await glob(testFilePatterns, {
				cwd: PathUtil.getRepositoryRootPath(repositoryName),
				ignore: ["**/node_modules/**"]
			})

			config.setOutput(`Found ${testFilePaths.length} test file paths!`)

			return testFilePaths
		}) as string[]
	}

	private async loadTestFiles(project: Project, testFilePaths: string[], repositoryName: RepositoryName): Promise<void> {
		await TracingUtil.traceTask("Load test files...", async () => {
			await DataProcessUtil.process({
				items: testFilePaths,
				batchSize: 1,
				handlerFn: async (testFilePath, { current, total }) => {
					await TracingUtil.traceAction(`Loading ${current} of ${total} method files...`, async () => {
						const resolvedTestFilePath = PathUtil.resolveRelativeFilePath(repositoryName, testFilePath)
						project.addSourceFileAtPath(resolvedTestFilePath)
					})
				}
			})
		})
	}

	private async searchMethodFilePaths(methodFilePatterns: string[], testFilePatterns: string[], repositoryName: RepositoryName): Promise<string[]> {
		return await TracingUtil.traceTask("Searching method file paths...", async (config) => {
			const methodFilePaths = await glob(methodFilePatterns, {
				cwd: PathUtil.getRepositoryRootPath(repositoryName),
				ignore: ["**/node_modules/**", ...testFilePatterns]
			})

			config.setOutput(`Found ${methodFilePaths.length} method file paths!`)

			return methodFilePaths
		}) as string[]
	}

	private async exploreMethodFiles(project: Project, methodFilePaths: string[], repositoryName: RepositoryName, testFilePatterns: string[]): Promise<ExploredMethod[]> {
		const exploredMethods: ExploredMethod[] = []

		await TracingUtil.traceTask("Process method files", async () => {
			await DataProcessUtil.process({
				items: methodFilePaths,
				batchSize: 20,
				handlerFn: async (methodFilePath, { current, total }) => {
					await TracingUtil.traceAction(`Processing ${current} of ${total} method files...`, async () => {
						const resolvedMethodFilePath = PathUtil.resolveRelativeFilePath(repositoryName, methodFilePath)
						const methodSourceFile = project.addSourceFileAtPath(resolvedMethodFilePath)

						const nodes = NodeJSCodeParserUtil.extractNodes(methodSourceFile, [
							{ type: "class" },
							{ type: "function" }
						])

						nodes.forEach(node => {
							const referencedFilePaths = node.findReferencesAsNodes().map(node => node.getSourceFile().getFilePath())
							const resolvedTestFilePath = referencedFilePaths.find(referencedFilePath => micromatch.isMatch(referencedFilePath, testFilePatterns))

							const exploredMethod: ExploredMethod = {
								name: node.getName(),
								declarationType: NodeJSCodeParserUtil.turnSyntaxKindIntoDeclarationType(node.getKind()),
								resolvedMethodFilePath,
								resolvedTestFilePath
							}

							exploredMethods.push(exploredMethod)
						})

						project.removeSourceFile(methodSourceFile)
					})
				}
			})
		})

		return exploredMethods
	}
}

export default new MethodExplorerService()
