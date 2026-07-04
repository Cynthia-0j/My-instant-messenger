export const DEFAULT_THEME_COLOR = '#4f46e5';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const bigint = parseInt(full, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;

const adjustColor = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    clamp(r + amount, 0, 255),
    clamp(g + amount, 0, 255),
    clamp(b + amount, 0, 255)
  );
};

export const generateThemeFromColor = (color: string) => ({
  primary: color,
  secondary: adjustColor(color, 22),
  surface: adjustColor(color, -18),
  background: adjustColor(color, -32),
  text: '#f8fafc',
});
