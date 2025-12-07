import yargs from "yargs"
import { hideBin } from "yargs/helpers"

import { ParsedProcessArguments } from "@/Protocols/ProcessArgumentProtocol"

class ProcessArgumentUtil {
	parseArgs(argv: string[]): ParsedProcessArguments {
		return yargs(hideBin(argv)).parse() as unknown as ParsedProcessArguments
	}
}

export default new ProcessArgumentUtil()