import { hc } from "hono/client";
import type { AppType } from "@sendtally/sync-service/app";
import { ApiError } from "./types";
import type {
  ClimbSummary,
  ConnectionStatus,
  Entitlements,
  GradeScales,
  LogSessionInput,
  PostOutcome,
  ProjectInput,
  SessionDetail,
  SessionRow,
  SessionTag,
  SessionWithClimbs,
  TagSummary,
} from "./types";

export * from "./types";

export type TokenProvider = () => Promise<string | null>;

type JsonResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

// hono/client resolves every status, so this is where a non-2xx becomes the
// ApiError the screens catch.
async function body<T>(pending: Promise<JsonResponse>): Promise<T> {
  const response = await pending;
  if (!response.ok) {
    const failure = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(
      response.status,
      failure?.error ?? `request failed: HTTP ${response.status}`
    );
  }
  return (await response.json()) as T;
}

export class SendtallyApi {
  private readonly client: ReturnType<typeof hc<AppType>>;

  constructor(baseUrl: string, getToken: TokenProvider) {
    this.client = hc<AppType>(baseUrl, {
      headers: async () => {
        const token = await getToken();
        if (token === null) throw new ApiError(401, "not signed in");
        return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      },
    });
  }

  status(): Promise<ConnectionStatus> {
    return body(this.client.v1.status.$get());
  }

  entitlements(): Promise<Entitlements> {
    return body(this.client.v1.entitlements.$get());
  }

  refreshEntitlements(): Promise<Entitlements> {
    return body(this.client.v1.entitlements.refresh.$post());
  }

  sessions(): Promise<{ sessions: SessionRow[] }> {
    return body(this.client.v1.sessions.$get());
  }

  sessionsWithClimbs(): Promise<{ sessions: SessionWithClimbs[] }> {
    return body(this.client.v1.sessions.$get({ query: { include: "climbs" } }));
  }

  session(fingerprint: string): Promise<{ session: SessionDetail }> {
    return body(this.client.v1.sessions[":fingerprint"].$get({ param: { fingerprint } }));
  }

  logSession(input: LogSessionInput): Promise<{ session: SessionDetail }> {
    return body(this.client.v1.sessions.$post({ json: input }));
  }

  updateLoggedSession(
    fingerprint: string,
    input: LogSessionInput
  ): Promise<{ session: SessionDetail }> {
    return body(
      this.client.v1.sessions[":fingerprint"].$put({ param: { fingerprint }, json: input })
    );
  }

  deleteLoggedSession(fingerprint: string): Promise<{ deleted: boolean }> {
    return body(this.client.v1.sessions[":fingerprint"].$delete({ param: { fingerprint } }));
  }

  tags(): Promise<{ tags: TagSummary[] }> {
    return body(this.client.v1.tags.$get());
  }

  setSessionTags(fingerprint: string, tags: string[]): Promise<{ tags: SessionTag[] }> {
    return body(
      this.client.v1.sessions[":fingerprint"].tags.$put({ param: { fingerprint }, json: { tags } })
    );
  }

  setSessionNotes(fingerprint: string, notes: string): Promise<{ notes: string | null }> {
    return body(
      this.client.v1.sessions[":fingerprint"].notes.$put({
        param: { fingerprint },
        json: { notes },
      })
    );
  }

  setGradeScales(scales: Partial<GradeScales>): Promise<{ gradeScales: GradeScales }> {
    return body(this.client.v1.preferences["grade-scales"].$put({ json: scales }));
  }

  climbs(): Promise<{ climbs: ClimbSummary[] }> {
    return body(this.client.v1.climbs.$get());
  }

  saveProject(project: ProjectInput): Promise<{ slug: string }> {
    return body(this.client.v1.projects.$post({ json: project }));
  }

  unmarkProject(slug: string): Promise<{ deleted: boolean }> {
    return body(this.client.v1.projects[":slug"].$delete({ param: { slug } }));
  }

  postSessionToStrava(
    fingerprint: string
  ): Promise<{ outcome: PostOutcome; reason?: string; session: SessionDetail }> {
    return body(this.client.v1.sessions[":fingerprint"].strava.$post({ param: { fingerprint } }));
  }

  setStravaPosting(
    enabled: boolean,
    since?: string | null
  ): Promise<{ postingEnabled: boolean; postSince: string | null }> {
    return body(
      this.client.v1.connections.strava.posting.$put({ json: { enabled, since: since ?? null } })
    );
  }

  stravaAuthorizeUrl(): Promise<{ url: string }> {
    return body(this.client.v1.connect.strava.start.$get());
  }

  deleteAccount(): Promise<{ deleted: boolean }> {
    return body(this.client.v1.account.$delete());
  }
}
