const plugin = require('tailwindcss/plugin');
const {
  palettes,
  fonts,
  layout,
  toVariables,
} = require('./constants/design-tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    screens: Object.fromEntries(
      Object.entries(layout.breakpoints).map(([key, value]) => [
        key,
        `${value}px`,
      ]),
    ),
    spacing: Object.fromEntries(
      Object.entries(layout.spacing).map(([key, value]) => [key, `${value}px`]),
    ),
    extend: {
      colors: Object.fromEntries(
        Object.keys(palettes.light).map((name) => [
          name,
          `rgb(var(--color-${name}) / <alpha-value>)`,
        ]),
      ),
      fontFamily: {
        sans: [fonts.regular],
        medium: [fonts.medium],
        semibold: [fonts.semibold],
        bold: [fonts.bold],
      },
      fontSize: {
        caption: ['12px', { lineHeight: '18px' }],
        label: ['14px', { lineHeight: '20px' }],
        body: ['16px', { lineHeight: '26px' }],
        lead: ['18px', { lineHeight: '28px' }],
        title: ['24px', { lineHeight: '32px', letterSpacing: '-0.4px' }],
        heading: ['32px', { lineHeight: '40px', letterSpacing: '-0.8px' }],
        display: ['40px', { lineHeight: '48px', letterSpacing: '-1px' }],
      },
      borderRadius: Object.fromEntries(
        Object.entries(layout.radius).map(([key, value]) => [
          key,
          `${value}px`,
        ]),
      ),
      maxWidth: Object.fromEntries(
        Object.entries(layout.containers).map(([key, value]) => [
          key,
          `${value}px`,
        ]),
      ),
      minHeight: { touch: `${layout.touchTarget}px` },
    },
  },
  plugins: [
    plugin(({ addBase }) =>
      addBase({
        ':root': toVariables(palettes.light),
        '.dark': toVariables(palettes.dark),
      }),
    ),
  ],
};
