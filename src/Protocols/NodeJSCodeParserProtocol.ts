import { ClassDeclaration, FunctionDeclaration, InterfaceDeclaration, MethodDeclaration, TypeAliasDeclaration } from "ts-morph"

export type DeclarationType = "class" | "interface" | "type" | "function" | "method"

export type ExtractionRule = {
	type: DeclarationType
	name?: string
}

export type NodeType =
	ClassDeclaration |
	InterfaceDeclaration |
	TypeAliasDeclaration |
	FunctionDeclaration |
	MethodDeclaration
