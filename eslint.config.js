const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', 'coverage/**', 'convex/_generated/**', '.cxx/**'] },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        beforeAll: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
]);
