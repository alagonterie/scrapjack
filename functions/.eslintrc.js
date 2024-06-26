module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "@typescript-eslint/no-empty-function": 0,
    "indent": ["error", 2],
    "max-len": ["error", {"code": 120}],
    "require-jsdoc": 0,
    "valid-jsdoc": 0,
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "no-trailing-spaces": 0,
    "linebreak-style": 0,
  },
};
