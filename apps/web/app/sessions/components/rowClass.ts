/** A log row's classes: set in inside a group, the hairline under it, and whether it opens. */
export function rowClass(inset: boolean, divider: boolean, link: boolean): string {
  return [
    "log-row",
    inset ? "log-row--inset" : "",
    divider ? "log-row--divided" : "",
    link ? "log-row--link" : "",
  ]
    .filter((c) => c !== "")
    .join(" ");
}
