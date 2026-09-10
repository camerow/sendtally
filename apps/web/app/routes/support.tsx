import React from "react";
import type { LinksFunction } from "react-router";
import { LegalPage, legalLinks } from "../legal/components/LegalPage";
import { pageMeta } from "../lib/seo";

export const links: LinksFunction = legalLinks;

export function meta(): Array<Record<string, string>> {
  return pageMeta({
    title: "Support - sendtally",
    description:
      "How to get help with sendtally: signing in, Strava, membership, deleting your account, and how to reach a person.",
    path: "/support",
  });
}

export default function Support(): React.ReactElement {
  return (
    <LegalPage
      title="Support"
      updated="8 SEPTEMBER 2026"
      lede="One person builds and answers for sendtally. Email gets a reply, usually within a couple of days."
    >
      <h2>Get in touch</h2>
      <p>
        Email <a href="mailto:hello@sendtally.com">hello@sendtally.com</a>. Tell us what you did,
        what you expected, and what happened instead. If it is about one session, the date and the
        location are usually enough to find it.
      </p>

      <h2>Signing in</h2>
      <p>
        Sign-in uses a one-time code sent to your email rather than a password. If the code does not
        arrive, check the spam folder and confirm you used the same address you signed up with. Ask
        for a new code rather than reusing an old one, since each code expires.
      </p>

      <h2>Strava</h2>
      <p>
        Connect Strava on sendtally.com. Each session posts as one Rock Climbing activity with the
        climb log in the description. Sessions are fingerprinted, so editing a session and posting
        again never creates a second activity.
      </p>
      <p>
        If posting stops working, the usual cause is that Strava access lapsed or was revoked.
        Reconnect on the web and posting resumes. To stop entirely, revoke sendtally from your
        Strava settings.
      </p>

      <h2>Membership</h2>
      <p>
        Logging sessions, effort scores and Strava posting are free. Membership adds the trends
        screens: volume, grade pyramid, hardest send, flash rate and average grade. Subscriptions
        are managed on sendtally.com, where you can also change or cancel one.
      </p>

      <h2>Deleting your account</h2>
      <p>
        Settings has a Delete account control on both the web and the app. It revokes Strava,
        removes every session and token we hold, and deletes your sign-in record. It is immediate
        and cannot be undone, so export anything you want to keep first.
      </p>

      <h2>Privacy and terms</h2>
      <p>
        The <a href="/privacy">privacy policy</a> covers what is stored and who sees it. The{" "}
        <a href="/terms">terms</a> cover the rest.
      </p>
    </LegalPage>
  );
}
