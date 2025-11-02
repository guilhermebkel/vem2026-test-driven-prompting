import { exec } from "child_process"
import { promisify } from "util"

class ShellUtil {
	async executeCommand(command: string, currentWorkingDirectoryPath?: string): Promise<string> {
		const execAsync = promisify(exec)

		const { stdout } = await execAsync(command, {
			cwd: currentWorkingDirectoryPath
		})

		return stdout
	}
}

export default new ShellUtil()
