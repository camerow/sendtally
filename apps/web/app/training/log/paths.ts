import { doneParams, type DoneParams } from "@sendtally/features/workouts";

export const activityPath = (id: string): string => `/app/activity/${encodeURIComponent(id)}`;

export const activityEditPath = (id: string): string => `${activityPath(id)}/edit`;

export const newActivityPath = (params: Record<string, string>): string =>
  `/app/activity/new?${new URLSearchParams(params)}`;

export const donePath = (p: DoneParams): string =>
  `/app/workout/done?${new URLSearchParams(doneParams(p))}`;
