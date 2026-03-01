import { exec } from "child_process"
import { promisify } from "util"

import { CommandOptions } from "@/Protocols/ShellProtocol"

class ShellUtil {
	async executeCommand(command: string, options?: CommandOptions): Promise<string> {
		const execAsync = promisify(exec)

		const { stdout } = await execAsync(command, {
			cwd: options?.currentWorkingDirectoryPath,
			env: options?.environmentVariables,
			maxBuffer: 1024 * 1024 * 500 // 500MB
		})

		return stdout
	}
}

export default new ShellUtil()
