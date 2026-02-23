import { createHash } from "crypto"

class HashUtil {
	turnIntoSHA1(data: unknown): string {
		return createHash("sha1").update(JSON.stringify(data)).digest("hex")
	}
}

export default new HashUtil()
