// Vitest inlines a `?raw` import; tsc needs telling.
declare module "*.csv?raw" {
  const text: string;
  export default text;
}
