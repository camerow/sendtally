import { ApiError, type Exercise } from "@sendtally/api-client";

/** The exercise already holding a name a save asked for, from the API's 409. */
export const takenBy = (error: unknown): Exercise | undefined =>
  error instanceof ApiError && error.status === 409
    ? (error.body as { exercise?: Exercise } | null)?.exercise
    : undefined;
