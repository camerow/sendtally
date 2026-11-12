import type { MenuRowProps } from "./MenuRow";

/** A made-up row in an empty log's preview. */
export type ExampleRowData = { daysAgo: number; title: string; meta: string };

/** One of an empty log's other ways in. */
export type LogEmptyAction = MenuRowProps & { key: string };
