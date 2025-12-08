import { CodeBLEUResult } from "@/Protocols/CodeBLEUProtocol"

import PathUtil from "@/Utils/PathUtil"
import ShellUtil from "@/Utils/ShellUtil"

class CodeBLEUUtil {
	async compute(referenceCode: string, candidateCode: string): Promise<CodeBLEUResult> {
		const encode = (str: string): string => Buffer.from(str, "utf8").toString("base64")

		const refsB64 = encode(referenceCode)
		const hypB64 = encode(candidateCode)

		const result = await ShellUtil.executeCommand(
			`python3 compute-code-bleu-v2.py --refs ${refsB64} --hyp ${hypB64} --lang "javascript"`,
			PathUtil.getScriptsDirectoryPath()
		)

		return JSON.parse(result)
	}
}

export default new CodeBLEUUtil()
