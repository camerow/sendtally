import { hc } from "hono/client";
import type { AppType } from "@sendtally/api/app";
import { ApiError } from "./types";
import type {
  Area,
  AreaClimb,
  AreaClimbDraftInput,
  AreaClimbInput,
  AreaClimbPage,
  AreaDraft,
  AreaDraftInput,
  AreaInput,
  AreaPage,
  AreaRedirect,
  AreaSimilarInput,
  AreaSummary,
  ContentReportInput,
  ClimbSummary,
  EntryDetail,
  EntryInput,
  JournalEntry,
  ConnectionStatus,
  Entitlements,
  GradeScales,
  Gym,
  GymInput,
  ImportBody,
  ImportResult,
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

/** A request that changed something on the server, as the path it hit. */
export type ApiWrite = { method: string; path: string };

type JsonResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

// hono/client resolves every status, so this is where a non-2xx becomes the
// ApiError the screens catch.
async function body<T>(pending: Promise<JsonResponse>): Promise<T> {
  const response = await pending;
  if (!response.ok) {
    const failure = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(
      response.status,
      failure?.error ?? `request failed: HTTP ${response.status}`,
      failure
    );
  }
  return (await response.json()) as T;
}

export class SendtallyApi {
  private readonly client: ReturnType<typeof hc<AppType>>;

  /** `onWrite` runs after every successful non-GET request, which is how a client cache learns which reads are stale. */
  constructor(baseUrl: string, getToken: TokenProvider, onWrite?: (write: ApiWrite) => void) {
    this.client = hc<AppType>(baseUrl, {
      fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const response = await fetch(input, init);
        const method = init?.method ?? "GET";
        if (response.ok && method !== "GET") {
          const url = input instanceof Request ? input.url : input.toString();
          onWrite?.({ method, path: new URL(url).pathname });
        }
        return response;
      },
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

  importSessions(input: ImportBody): Promise<ImportResult> {
    return body(this.client.v1.sessions.import.$post({ json: input }));
  }

  async exportCsv(): Promise<string> {
    const response = await this.client.v1["export.csv"].$get();
    if (!response.ok) throw new ApiError(response.status, `export failed: HTTP ${response.status}`);
    return response.text();
  }

  deleteLoggedSession(fingerprint: string): Promise<{ deleted: boolean }> {
    return body(this.client.v1.sessions[":fingerprint"].$delete({ param: { fingerprint } }));
  }

  entries(): Promise<{ entries: JournalEntry[] }> {
    return body(this.client.v1.entries.$get());
  }

  entry(id: string): Promise<{ entry: EntryDetail }> {
    return body(this.client.v1.entries[":id"].$get({ param: { id } }));
  }

  createEntry(input: EntryInput): Promise<{ entry: EntryDetail }> {
    return body(this.client.v1.entries.$post({ json: input }));
  }

  updateEntry(id: string, input: EntryInput): Promise<{ entry: EntryDetail }> {
    return body(this.client.v1.entries[":id"].$put({ param: { id }, json: input }));
  }

  deleteEntry(id: string): Promise<{ deleted: boolean }> {
    return body(this.client.v1.entries[":id"].$delete({ param: { id } }));
  }

  tags(): Promise<{ tags: TagSummary[] }> {
    return body(this.client.v1.tags.$get());
  }

  setSessionTags(fingerprint: string, tags: string[]): Promise<{ tags: SessionTag[] }> {
    return body(
      this.client.v1.sessions[":fingerprint"].tags.$put({ param: { fingerprint }, json: { tags } })
    );
  }

  setGradeScales(scales: Partial<GradeScales>): Promise<{ gradeScales: GradeScales }> {
    return body(this.client.v1.preferences["grade-scales"].$put({ json: scales }));
  }

  climbs(): Promise<{ climbs: ClimbSummary[] }> {
    return body(this.client.v1.climbs.$get());
  }

  setClimbNote(fingerprint: string, slug: string, note: string): Promise<{ note: string | null }> {
    return body(
      this.client.v1.sessions[":fingerprint"].climbs[":slug"].note.$put({
        param: { fingerprint, slug },
        json: { note },
      })
    );
  }

  saveProject(project: ProjectInput): Promise<{ slug: string }> {
    return body(this.client.v1.projects.$post({ json: project }));
  }

  unmarkProject(slug: string): Promise<{ deleted: boolean }> {
    return body(this.client.v1.projects[":slug"].$delete({ param: { slug } }));
  }

  gyms(): Promise<{ gyms: Gym[] }> {
    return body(this.client.v1.gyms.$get());
  }

  createGym(input: GymInput): Promise<{ gym: Gym | null }> {
    return body(this.client.v1.gyms.$post({ json: input }));
  }

  updateGym(id: string, input: GymInput): Promise<{ gym: Gym | null }> {
    return body(this.client.v1.gyms[":id"].$put({ param: { id }, json: input }));
  }

  deleteGym(id: string): Promise<{ deleted: boolean }> {
    return body(this.client.v1.gyms[":id"].$delete({ param: { id } }));
  }

  area(slug: string): Promise<AreaPage | AreaRedirect> {
    return body(this.client.v1.areas[":slug"].$get({ param: { slug } }));
  }

  similarAreas(input: AreaSimilarInput): Promise<{ candidates: AreaSummary[] }> {
    return body(this.client.v1.areas.similar.$post({ json: input }));
  }

  createArea(input: AreaInput): Promise<{ area: Area | null }> {
    return body(this.client.v1.areas.$post({ json: input }));
  }

  areaDraft(id: string): Promise<{ draft: AreaDraft | null }> {
    return body(this.client.v1.areas[":id"].draft.$get({ param: { id } }));
  }

  saveAreaDraft(id: string, input: AreaDraftInput): Promise<{ draft: AreaDraft }> {
    return body(this.client.v1.areas[":id"].draft.$put({ param: { id }, json: input }));
  }

  areaClimb(slug: string): Promise<AreaClimbPage | AreaRedirect> {
    return body(this.client.v1["area-climbs"][":slug"].$get({ param: { slug } }));
  }

  searchAreas(q: string, near?: { lat: number; lon: number }): Promise<{ areas: AreaSummary[] }> {
    return body(
      this.client.v1.areas.$get({
        query: { q, ...(near === undefined ? {} : { near: `${near.lat},${near.lon}` }) },
      })
    );
  }

  searchAreaClimbs(q: string, areaId?: string): Promise<{ climbs: AreaClimb[] }> {
    return body(
      this.client.v1["area-climbs"].$get({
        query: { q, ...(areaId === undefined ? {} : { areaId }) },
      })
    );
  }

  similarAreaClimbs(areaId: string, name: string): Promise<{ candidates: AreaClimb[] }> {
    return body(this.client.v1["area-climbs"].similar.$post({ json: { areaId, name } }));
  }

  createAreaClimb(input: AreaClimbInput): Promise<{ climb: AreaClimb | null }> {
    return body(this.client.v1["area-climbs"].$post({ json: input }));
  }

  areaClimbDraft(id: string): Promise<{ draft: AreaDraft | null }> {
    return body(this.client.v1["area-climbs"][":id"].draft.$get({ param: { id } }));
  }

  saveAreaClimbDraft(id: string, input: AreaClimbDraftInput): Promise<{ draft: AreaDraft }> {
    return body(this.client.v1["area-climbs"][":id"].draft.$put({ param: { id }, json: input }));
  }

  reportDuplicateClimb(id: string, keepClimbId: string): Promise<{ report: { id: string } }> {
    return body(
      this.client.v1["area-climbs"][":id"]["duplicate-reports"].$post({
        param: { id },
        json: { keepClimbId },
      })
    );
  }

  reportAreaIssue(input: ContentReportInput): Promise<{ report: { id: string } }> {
    return body(this.client.v1.areas.reports.$post({ json: input }));
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

  stravaAuthorizeUrl(returnTo: "web" | "app" = "web"): Promise<{ url: string }> {
    return body(this.client.v1.connect.strava.start.$get({ query: { return: returnTo } }));
  }

  deleteAccount(): Promise<{ deleted: boolean }> {
    return body(this.client.v1.account.$delete());
  }
}
