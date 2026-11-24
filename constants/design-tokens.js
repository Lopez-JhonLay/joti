// Shared by Tailwind, native navigation, and the theme provider.
const palettes = {
  light: {
    background: '#F6F8FC',
    surface: '#FFFFFF',
    elevated: '#EDF2FA',
    foreground: '#172033',
    muted: '#526078',
    subtle: '#E6ECF5',
    border: '#CBD5E5',
    pattern: '#8CA8D2',
    primary: '#245BD6',
    'primary-pressed': '#1948B5',
    'on-primary': '#FFFFFF',
    link: '#245BD6',
    focus: '#245BD6',
    success: '#18734F',
    warning: '#8D530D',
    danger: '#B52D46',
  },
  dark: {
    background: '#0D1220',
    surface: '#151D2E',
    elevated: '#1E2A40',
    foreground: '#F1F5FC',
    muted: '#A9B7CE',
    subtle: '#243149',
    border: '#394963',
    pattern: '#526D99',
    primary: '#A5C4FF',
    'primary-pressed': '#80ACFF',
    'on-primary': '#122348',
    link: '#A5C4FF',
    focus: '#C3D8FF',
    success: '#74D7AF',
    warning: '#F3C67D',
    danger: '#FF9EB1',
  },
};

const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const layout = {
  breakpoints: { sm: 480, md: 768, lg: 1024 },
  containers: { reading: 640, screen: 960 },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },
  radius: { control: 999, card: 20, pill: 999 },
  touchTarget: 48,
  dotGrid: { spacing: 18, radius: 1 },
};

function toVariables(palette) {
  return Object.fromEntries(
    Object.entries(palette).map(([name, hex]) => [
      `--color-${name}`,
      [1, 3, 5]
        .map((start) => parseInt(hex.slice(start, start + 2), 16))
        .join(' '),
    ]),
  );
}

module.exports = { palettes, fonts, layout, toVariables };
