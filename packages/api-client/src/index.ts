import {
  ApiError,
  type ClimbSummary,
  type ConnectionStatus,
  type Entitlements,
  type GradeScales,
  type LogSessionInput,
  type PostOutcome,
  type ProjectInput,
  type SessionRow,
  type SessionDetail,
  type SessionTag,
  type SessionWithClimbs,
  type TagSummary,
} from "./types";

export * from "./types";

export type TokenProvider = () => Promise<string | null>;

export class SendtallyApi {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: TokenProvider
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();
    if (token === null) throw new ApiError(401, "not signed in");
    const resp = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!resp.ok) {
      const body = (await resp.json().catch(() => null)) as { error?: string } | null;
      throw new ApiError(resp.status, body?.error ?? `request failed: HTTP ${resp.status}`);
    }
    return (await resp.json()) as T;
  }

  status(): Promise<ConnectionStatus> {
    return this.request<ConnectionStatus>("/v1/status");
  }

  entitlements(): Promise<Entitlements> {
    return this.request<Entitlements>("/v1/entitlements");
  }

  refreshEntitlements(): Promise<Entitlements> {
    return this.request<Entitlements>("/v1/entitlements/refresh", { method: "POST" });
  }

  sessions(): Promise<{ sessions: SessionRow[] }> {
    return this.request<{ sessions: SessionRow[] }>("/v1/sessions");
  }

  sessionsWithClimbs(): Promise<{ sessions: SessionWithClimbs[] }> {
    return this.request<{ sessions: SessionWithClimbs[] }>("/v1/sessions?include=climbs");
  }

  session(fingerprint: string): Promise<{ session: SessionDetail }> {
    return this.request<{ session: SessionDetail }>(
      `/v1/sessions/${encodeURIComponent(fingerprint)}`
    );
  }

  logSession(input: LogSessionInput): Promise<{ session: SessionDetail }> {
    return this.request<{ session: SessionDetail }>("/v1/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateLoggedSession(
    fingerprint: string,
    input: LogSessionInput
  ): Promise<{ session: SessionDetail }> {
    return this.request<{ session: SessionDetail }>(
      `/v1/sessions/${encodeURIComponent(fingerprint)}`,
      { method: "PUT", body: JSON.stringify(input) }
    );
  }

  deleteLoggedSession(fingerprint: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>(`/v1/sessions/${encodeURIComponent(fingerprint)}`, {
      method: "DELETE",
    });
  }

  tags(): Promise<{ tags: TagSummary[] }> {
    return this.request<{ tags: TagSummary[] }>("/v1/tags");
  }

  setSessionTags(fingerprint: string, tags: string[]): Promise<{ tags: SessionTag[] }> {
    return this.request<{ tags: SessionTag[] }>(
      `/v1/sessions/${encodeURIComponent(fingerprint)}/tags`,
      { method: "PUT", body: JSON.stringify({ tags }) }
    );
  }

  setSessionNotes(fingerprint: string, notes: string): Promise<{ notes: string | null }> {
    return this.request<{ notes: string | null }>(
      `/v1/sessions/${encodeURIComponent(fingerprint)}/notes`,
      { method: "PUT", body: JSON.stringify({ notes }) }
    );
  }

  setGradeScales(scales: Partial<GradeScales>): Promise<{ gradeScales: GradeScales }> {
    return this.request<{ gradeScales: GradeScales }>("/v1/preferences/grade-scales", {
      method: "PUT",
      body: JSON.stringify(scales),
    });
  }

  climbs(): Promise<{ climbs: ClimbSummary[] }> {
    return this.request<{ climbs: ClimbSummary[] }>("/v1/climbs");
  }

  saveProject(project: ProjectInput): Promise<{ slug: string }> {
    return this.request<{ slug: string }>("/v1/projects", {
      method: "POST",
      body: JSON.stringify(project),
    });
  }

  unmarkProject(slug: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>(`/v1/projects/${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
  }

  postSessionToStrava(
    fingerprint: string
  ): Promise<{ outcome: PostOutcome; reason?: string; session: SessionDetail }> {
    return this.request(`/v1/sessions/${encodeURIComponent(fingerprint)}/strava`, {
      method: "POST",
    });
  }

  setStravaPosting(
    enabled: boolean,
    since?: string | null
  ): Promise<{ postingEnabled: boolean; postSince: string | null }> {
    return this.request("/v1/connections/strava/posting", {
      method: "PUT",
      body: JSON.stringify({ enabled, since: since ?? null }),
    });
  }

  stravaAuthorizeUrl(): Promise<{ url: string }> {
    return this.request<{ url: string }>("/v1/connect/strava/start");
  }

  deleteAccount(): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>("/v1/account", { method: "DELETE" });
  }
}
