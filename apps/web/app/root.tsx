import { ClerkProvider } from "@clerk/react-router";
import { clerkMiddleware } from "@clerk/react-router/server";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs, MiddlewareFunction } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "react-router";
import designStyles from "@sendtally/design/styles.css?url";
import { cloudflareContext } from "./lib/cloudflare-context";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: designStyles },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
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

export async function loader(args: LoaderFunctionArgs): Promise<{
  gaMeasurementId: string | null;
  posthog: { token: string; host: string } | null;
}> {
  const { env } = args.context.get(cloudflareContext);
  return rootAuthLoader(args, () => ({
    gaMeasurementId: env.GA_MEASUREMENT_ID ?? null,
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

function GoogleAnalytics({ measurementId }: { measurementId: string }): React.ReactElement {
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: [
            "window.dataLayer=window.dataLayer||[];",
            "function gtag(){dataLayer.push(arguments);}",
            "gtag('js',new Date());",
            `gtag('config',${JSON.stringify(measurementId)});`,
          ].join(""),
        }}
      />
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {data?.gaMeasurementId ? <GoogleAnalytics measurementId={data.gaMeasurementId} /> : null}
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

export default function App(): React.ReactElement {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <ClerkProvider loaderData={loaderData}>
      <Outlet />
    </ClerkProvider>
  );
}
