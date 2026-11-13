export const activityPath = (id: string): string => `/app/activity/${encodeURIComponent(id)}`;

export const activityEditPath = (id: string): string => `${activityPath(id)}/edit`;
