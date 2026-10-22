export type StatisticsView = "overview" | "climbing" | "hangboard" | "exercises";

export type StatisticsParams = { view?: StatisticsView; workout?: string; grip?: string };
