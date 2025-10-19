export type AnyOtherString = (string & {})

export type OptionalRecord<Key extends string, Value> = {
	[key in Key]?: Value
}