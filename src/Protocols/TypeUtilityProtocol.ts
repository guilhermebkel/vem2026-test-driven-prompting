export type AnyOtherString = (string & {})

export type OptionalRecord<Key extends string | number | symbol, Value> = {
	[key in Key]?: Value
}

export type DeepPartial<T> = {
	[P in keyof T]?: DeepPartial<T[P]>
}
