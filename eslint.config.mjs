import {dirname} from "path";
import {fileURLToPath} from "url";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals",
        "next/typescript"
    ),
    {
        rules: {
            // Allow unused variables/args if they start with "_"
            "@typescript-eslint/no-unused-vars": ["warn", {
                varsIgnorePattern: "^_",
                argsIgnorePattern: "^_",
                ignoreRestSiblings: true
            }],
            "@typescript-eslint/no-explicit-any": "off",
            "prefer-const": "off",
            "@next/next/no-html-link-for-pages": "off",
            "@typescript-eslint/no-require-imports":"off",
            "react/no-unescaped-entities": "off",
            "@typescript-eslint/ban-ts-comment": "off",
        },
    },
];


export default eslintConfig;
