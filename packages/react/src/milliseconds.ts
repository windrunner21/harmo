// A CSS time, such as "0.2s" or "150ms", in milliseconds, or the fallback when
// it isn't one.
export const milliseconds = (value: string, fallback: number) => {
  const number = parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return value.trim().endsWith("ms") ? number : number * 1000;
};
