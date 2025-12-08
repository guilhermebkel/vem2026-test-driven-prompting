import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"

class CodeBLEUUtil {
	async compute(referenceResolvedFilePath: string, candidateResolvedFilePath: string, language: "js"): Promise<number> {
		const result = await ShellUtil.executeCommand(
			`python3 compute-code-bleu.py --refs ${referenceResolvedFilePath} --hyp ${candidateResolvedFilePath} --lang ${language}`,
			PathUtil.getScriptsDirectoryPath()
		)

		console.log(result)

		return 1
	}
}

export default new CodeBLEUUtil()
