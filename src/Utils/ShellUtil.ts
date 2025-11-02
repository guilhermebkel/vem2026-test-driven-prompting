import { exec } from "child_process"
import { promisify } from "util"

class ShellUtil {
	async executeCommand(command: string, path?: string): Promise<string> {
		const execAsync = promisify(exec)

		const { stdout } = await execAsync(command, {
			cwd: path
		})

		return stdout
	}
}

export default new ShellUtil()
