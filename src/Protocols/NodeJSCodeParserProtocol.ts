import { CallExpression, ClassDeclaration, FunctionDeclaration, InterfaceDeclaration, MethodDeclaration, Project, TypeAliasDeclaration } from "ts-morph"

export type DeclarationTypeToNodeType = {
	class: ClassDeclaration
	interface: InterfaceDeclaration
	type: TypeAliasDeclaration
	function: FunctionDeclaration
	method: MethodDeclaration
	"test-case": CallExpression
}

export type DeclarationType = keyof DeclarationTypeToNodeType

export type NodeType<DType extends DeclarationType> = DeclarationTypeToNodeType[DType]

export type ProjectType = Project

export type ExtractionRule<DType extends DeclarationType> = {
	type: DType
	name?: string
}
