// Joins a component's own class with the one a consumer passes.
export const withClass = (base: string, extra: string | undefined) => (extra ? `${base} ${extra}` : base);
