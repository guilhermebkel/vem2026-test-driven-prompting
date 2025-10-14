import eslintPluginTs from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": eslintPluginTs
    },
    rules: {
      ...eslintPluginTs.configs.recommended.rules,
      quotes: ["error", "double", { avoidEscape: true }],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: false, 
          allowHigherOrderFunctions: false
        }
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      semi: ["error", "never"],
			indent: ["error", "tab", { SwitchCase: 1 }],
			camelcase: [
				"error",
				{
					properties: "always",
					ignoreDestructuring: false,
					ignoreImports: false,
					ignoreGlobals: false
				}
			],
			"@typescript-eslint/indent": "off",
			"@typescript-eslint/semi": "off",
      "comma-dangle": ["error", "never"]
    }
  }
]
