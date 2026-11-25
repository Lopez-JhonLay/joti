const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const {
  cssToReactNativeRuntime,
} = require('react-native-css-interop/css-to-rn');
const { StyleSheet } = require('react-native-css-interop');

jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: () => [true, null],
  isLoaded: () => true,
}));

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: {
    open: jest.fn(),
    dismiss: jest.fn(async () => false),
  },
}));

// NativeWind deliberately skips automatic core-component registration in Jest.
require('react-native-css-interop/dist/runtime/components');

beforeAll(async () => {
  process.env.NATIVEWIND_OS = 'android';
  const input = fs.readFileSync(path.join(__dirname, '../global.css'), 'utf8');
  const { css } = await postcss([
    tailwind(require('../tailwind.config')),
  ]).process(input, { from: undefined });
  StyleSheet.registerCompiled(cssToReactNativeRuntime(css, { inlineRem: 16 }));
});
