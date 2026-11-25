const expoPreset = require('jest-expo/jest-preset');

module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transformIgnorePatterns: expoPreset.transformIgnorePatterns.map((pattern) =>
    pattern.replace('(.pnpm|', '(convex-test|@convex-dev/auth|.pnpm|'),
  ),
  moduleNameMapper: {
    '\\.css$': '<rootDir>/tests/style-mock.js',
    // Metro uses Lucide's native ESM export; Jest runs the same icons' CJS build.
    '^lucide-react-native/icons/(.*)$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js',
  },
};
