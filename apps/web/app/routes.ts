import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-in/verify", "routes/sign-in.verify.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("sso-callback", "routes/sso-callback.tsx"),
  route("connected/strava", "routes/connected.strava.tsx"),
  route("sitemap.xml", "routes/sitemap.xml.ts"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("support", "routes/support.tsx"),
  route("app", "routes/app.tsx", [
    index("routes/app._index.tsx"),
    route("setup", "routes/app.setup.tsx"),
    route("sessions/new", "routes/app.sessions.new.tsx"),
    route("sessions/:fingerprint", "routes/app.sessions.$fingerprint.tsx"),
    route("sessions/:fingerprint/edit", "routes/app.sessions.$fingerprint.edit.tsx"),
    route("projects", "routes/app.projects.tsx"),
    route("projects/:slug", "routes/app.projects.$slug.tsx"),
    route("trends", "routes/app.trends._index.tsx"),
    route("trends/:metric", "routes/app.trends.$metric.tsx"),
    route("settings", "routes/app.settings.tsx"),
    route("membership", "routes/app.membership.tsx"),
  ]),
] satisfies RouteConfig;
