import {
	PrototypeOptions,
	PrototypeResult
} from "@/Protocols/PrototypingProtocol"

class PrototypingModule {
	async prototype(options: PrototypeOptions): Promise<PrototypeResult> {
		console.log(options)
	}
}

export default new PrototypingModule()
