import { ClerkProvider, useAuth, useUser } from "@clerk/react-router";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { clerkMiddleware, rootAuthLoader } from "@clerk/react-router/server";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs, MiddlewareFunction } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import { deDE, esES, frFR } from "@clerk/localizations";
import { Logo } from "@sendtally/design";
import designStyles from "@sendtally/design/styles.css?url";
import type { Locale } from "@sendtally/features/i18n";
import { ErrorPage } from "./components/ErrorPage";
import { requestLocale } from "./lib/locale";
import { identify, resetIdentity } from "./lib/analytics";
import { createQueryClient } from "@sendtally/features/query";
import { cloudflareContext } from "./lib/cloudflare-context";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: designStyles },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
];

export const middleware: MiddlewareFunction<Response>[] = [
  (args, next) => {
    const { env } = args.context.get(cloudflareContext);
    return clerkMiddleware({
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
      secretKey: env.CLERK_SECRET_KEY,
    })(args, next);
  },
];

const CLERK_LOCALIZATIONS = { en: undefined, de: deDE, fr: frFR, es: esES } as const;

export async function loader(args: LoaderFunctionArgs): Promise<{
  locale: Locale;
  gtagIds: string[];
  posthog: { token: string; host: string } | null;
}> {
  const { env } = args.context.get(cloudflareContext);
  return rootAuthLoader(args, () => ({
    locale: requestLocale(args.request),
    gtagIds: [env.GA_MEASUREMENT_ID, env.GOOGLE_ADS_ID].filter((id): id is string => Boolean(id)),
    posthog:
      env.POSTHOG_PROJECT_TOKEN && env.POSTHOG_HOST
        ? { token: env.POSTHOG_PROJECT_TOKEN, host: env.POSTHOG_HOST }
        : null,
  }));
}

function PostHog({ token, host }: { token: string; host: string }): React.ReactElement {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="nu su ou au hu init Fu Ou Ru Au Nu za Pu ju Mu Uu Wu Vu capture getExtension $u iu Ju calculateEventProperties Zu register register_once register_for_session unregister unregister_for_session Yu Eu Qu getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync th identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset eh shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty Ku zu createPersonProfile setInternalOrTestUser Xu du vu opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Bu debug Ua Ts getPageViewId captureTraceFeedback captureTraceMetric Su".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init(${JSON.stringify(token)},{api_host:${JSON.stringify(host)},ui_host:'https://us.posthog.com',defaults:'2026-05-30',person_profiles:'identified_only'});`,
      }}
    />
  );
}

function GoogleTag({ ids }: { ids: string[] }): React.ReactElement {
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${ids[0]}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: [
            "window.dataLayer=window.dataLayer||[];",
            "function gtag(){dataLayer.push(arguments);}",
            "gtag('js',new Date());",
            ...ids.map((id) => `gtag('config',${JSON.stringify(id)});`),
          ].join(""),
        }}
      />
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang={data?.locale ?? "en"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {data && data.gtagIds.length > 0 ? <GoogleTag ids={data.gtagIds} /> : null}
        {data?.posthog ? <PostHog {...data.posthog} /> : null}
        <Meta />
        <Links />
      </head>
      <body
        style={{
          margin: 0,
          background: "var(--bs-white)",
          color: "var(--bs-gunmetal)",
          fontFamily: "var(--font-sans)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Ties browser events to the same key the Worker uses (the Clerk user id) and
 * puts the email on the person, which is what the project's internal-user
 * cohort filters us out by.
 */
function Identify(): null {
  const { isLoaded, isSignedIn, user } = useUser();
  const identified = React.useRef(false);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user !== null && user !== undefined) {
      identified.current = true;
      identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
        created_at: user.createdAt?.toISOString(),
      });
      return;
    }
    // Only on the way out: resetting on every anonymous page load would break
    // the anonymous-to-signed-up funnel by cutting the distinct id.
    if (identified.current) {
      identified.current = false;
      resetIdentity();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}

/** A cache is one person's log: signing out, or in as someone else, drops it. */
function ClearQueriesOnSignOut(): null {
  const client = useQueryClient();
  const { isLoaded, userId } = useAuth();
  const owner = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (owner.current !== null && owner.current !== userId) client.clear();
    owner.current = userId ?? null;
  }, [client, isLoaded, userId]);

  return null;
}

export default function App(): React.ReactElement {
  const loaderData = useLoaderData<typeof loader>();
  const [queryClient] = React.useState(createQueryClient);
  return (
    <ClerkProvider loaderData={loaderData} localization={CLERK_LOCALIZATIONS[loaderData.locale]}>
      <QueryClientProvider client={queryClient}>
        <Identify />
        <ClearQueriesOnSignOut />
        <Outlet />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export function ErrorBoundary(): React.ReactElement {
  const error = useRouteError();
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
      <a
        href="/"
        style={{
          display: "inline-flex",
          padding: "16px 0",
          borderBottom: "1px solid var(--line-on-light-soft)",
          width: "100%",
          textDecoration: "none",
        }}
      >
        <Logo tone="on-light" size={26} />
      </a>
      <ErrorPage error={error} />
    </div>
  );
}
