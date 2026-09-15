// Vitest inlines a `?raw` import; tsc needs telling. Used to run a data
// migration's own SQL against seeded rows, which is the only honest way to
// test a backfill that can never be re-run in production.
declare module "*.sql?raw" {
  const content: string;
  export default content;
}
