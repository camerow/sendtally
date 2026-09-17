import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@sendtally/api-client";

export const QUERY_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/** A 4xx says the request itself is wrong; asking again a second later cannot change the answer. */
function retry(failures: number, error: Error): boolean {
  return failures < 1 && !(error instanceof ApiError && error.status < 500);
}

/**
 * Reads render from cache and revalidate behind it. `staleTime` only stops the
 * several hooks on one screen from each refetching the same endpoint; freshness
 * after a write comes from `invalidateAfterWrite` in the API client's `onWrite`.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, gcTime: QUERY_CACHE_MAX_AGE, retry },
    },
  });
}
