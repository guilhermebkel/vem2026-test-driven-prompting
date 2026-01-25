import { exec } from "child_process"
import { promisify } from "util"

import { CommandOptions } from "@/Protocols/ShellProtocol"

class ShellUtil {
	async executeCommand(command: string, options?: CommandOptions): Promise<string> {
		const execAsync = promisify(exec)

		const { stdout } = await execAsync(command, {
			cwd: options?.currentWorkingDirectoryPath,
			env: options?.environmentVariables
		})

		return stdout
	}
}

export default new ShellUtil()
