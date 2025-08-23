export function normalize(x: number, min: number, max: number) {
  const t = Math.max(min, Math.min(max, x));
  return (t - min) / (max - min);
}

export function colorRamp(
  x: number,
  min: number,
  max: number,
  alpha = 0.8
): [number, number, number, number] {
  const t = normalize(x, min, max);
  const r = t < 0.5 ? 0 : Math.round(510 * (t - 0.5));
  const g = t < 0.5 ? Math.round(510 * t) : Math.round(510 * (1 - (t - 0.5)));
  const b = t < 0.5 ? Math.round(255 - 510 * t) : 0;
  return [r, g, b, Math.round(alpha * 255)];
}
