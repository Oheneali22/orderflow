import js from "@eslint/js";

export default [
  {
    ignores: ["coverage/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        Buffer: "readonly",
        clearInterval: "readonly",
        console: "readonly",
        process: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        URL: "readonly"
      }
    },
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["web/**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        fetch: "readonly",
        FormData: "readonly"
      }
    }
  }
];
