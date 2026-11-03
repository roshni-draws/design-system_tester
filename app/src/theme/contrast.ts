/** WCAG 2.x relative luminance and contrast, computed live from hex values. */
function channel(v: number) {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1, 7), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export type Grade = 'AAA' | 'AA' | 'AA large' | 'Fail';
export function grade(r: number): Grade {
  return r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Fail';
}
/** Black or white, whichever reads better on the given colour (used for labels on swatches only). */
export function readableOn(hex: string): string {
  return contrast(hex, '#000000') >= contrast(hex, '#FFFFFF') ? '#000000' : '#FFFFFF';
}
