import { SerializedSharedData } from "@/Protocols/WorkerProtocol"

class WorkerUtil {
	serializeSharedData(data: unknown): SerializedSharedData {
		const jsonString = JSON.stringify(data)
		const textEncoder = new TextEncoder()
		const dataBuffer = textEncoder.encode(jsonString)

		const sharedBuffer = new SharedArrayBuffer(dataBuffer.length)
		const sharedBufferView = new Uint8Array(sharedBuffer)
		sharedBufferView.set(dataBuffer)

		return sharedBuffer
	}

	deserializeSharedData<DeserializedSharedData>(serializedSharedData: SerializedSharedData): DeserializedSharedData {
		const textDecoder = new TextDecoder()
		const jsonString = textDecoder.decode(serializedSharedData)

		const deserializedSharedData = JSON.parse(jsonString) as DeserializedSharedData

		return deserializedSharedData
	}
}

export default new WorkerUtil()
