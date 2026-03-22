import MathUtil from "@/Utils/MathUtil"

class ArrayUtil {
	keepUniqueValues<Value>(array: Value[]): Value[] {
		const set = new Set<Value>(array)

		return Array.from(set)
	}

	getRandomValue<Value>(array: Value[]): Value {
		const randomIndex = MathUtil.generateRandomNumber(0, array.length - 1)

		return array[randomIndex] as Value
	}

	getValueFactorialPermutations<Value>(array: Value[]): Value[][] {
		return Array.from({ length: array.length }, (_, i) => i + 1).flatMap(size => this.getValuePermutations(array, size))
	}

	getValuePermutations<Value>(array: Value[], size: number): Value[][] {
		if (size === 0) {
			return []
		}

		if (size === 1) {
			return array.map(v => [v])
		}

		return array.flatMap((v, i) => (this.getValuePermutations([...array.slice(0, i), ...array.slice(i + 1)], size - 1).map(p => [v, ...p])))
	}
}

export default new ArrayUtil()
