import "dotenv/config"

import ExperimentService from "@/Services/ExperimentService"
import FileUtil from "@/Utils/FileUtil"

async function start(): Promise<void> {
	const METHOD_NAME = "subBusinessDays"

	const result = await ExperimentService.runExperiment({
		method: {
			name: METHOD_NAME,
			repositoryName: "date-fns",
			repositoryTestSuiteCommand: "pnpm run test",
			testRelativeFilePath: `/src/${METHOD_NAME}/test.ts`,
			methodRelativeFilePath: `/src/${METHOD_NAME}/index.ts`
		},
		reconstructionOptions: {
			model: {
				name: "gemini-2.5-flash",
				reasoningBudget: 0,
				temperature: 0
			},
			context: []
		}
	})

	await FileUtil.setFileContent(`./experiment-results/${METHOD_NAME}/failureMessage.txt`, result.repositoryTestSuiteResult.failureMessage || "")
	await FileUtil.setFileContent(`./experiment-results/${METHOD_NAME}/sourceFileWithReconstructedMethod.txt`, result.sourceFileWithReconstructedMethod)
	await FileUtil.setFileContent(`./experiment-results/${METHOD_NAME}/sourceFileWithOriginalMethod.txt`, result.sourceFileWithOriginalMethod)
	await FileUtil.setFileContent(`./experiment-results/${METHOD_NAME}/userPrompt.txt`, result.methodReconstructionResult.userPrompt)
	await FileUtil.setFileContent(`./experiment-results/${METHOD_NAME}/systemPrompt.txt`, result.methodReconstructionResult.systemPrompt)

	console.log({ success: result.repositoryTestSuiteResult.success })
}

start()