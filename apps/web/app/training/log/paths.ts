export const activityPath = (id: string): string => `/app/activity/${encodeURIComponent(id)}`;

export const activityEditPath = (id: string): string => `${activityPath(id)}/edit`;

/** A route and its params as one address. */
export const withParams = (pathname: string, params: Record<string, string>): string => {
  const query = new URLSearchParams(params).toString();
  return query === "" ? pathname : `${pathname}?${query}`;
};
