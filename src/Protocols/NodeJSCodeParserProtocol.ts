import { ClassDeclaration, FunctionDeclaration, InterfaceDeclaration, MethodDeclaration, TypeAliasDeclaration } from "ts-morph"

export type ExtractionRule = {
	kind: "class" | "interface" | "type" | "function" | "method"
	name?: string
}

export type NodeType =
	ClassDeclaration |
	InterfaceDeclaration |
	TypeAliasDeclaration |
	FunctionDeclaration |
	MethodDeclaration
