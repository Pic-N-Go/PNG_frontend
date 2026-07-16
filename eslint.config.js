const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ["dist/*", ".claude/**"],
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: { globals: globals.node },
  },
]);
