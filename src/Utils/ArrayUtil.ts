class ArrayUtil {
	keepUniqueValues<Item>(array: Item[]): Item[] {
		const set = new Set<Item>(array)

		return Array.from(set)
	}
}

export default new ArrayUtil()
