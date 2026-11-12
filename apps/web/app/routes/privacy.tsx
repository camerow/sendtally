import React from "react";
import type { LinksFunction } from "react-router";
import { LegalPage, legalLinks } from "../legal/components/LegalPage";
import { CONTACT_EMAIL } from "../legal/constants";
import { pageMeta } from "../lib/seo";

export const links: LinksFunction = legalLinks;

export function meta(): Array<Record<string, string>> {
  return pageMeta({
    title: "Privacy policy - sendtally",
    description:
      "Everything sendtally stores about you, who processes it, how Strava tokens are encrypted, and how to have all of it deleted the same day.",
    path: "/privacy",
  });
}

export default function Privacy(): React.ReactElement {
  return (
    <LegalPage
      title="Privacy policy"
      updated="12 NOVEMBER 2026"
      lede="sendtally holds the climbing sessions you type in and almost nothing else. This page lists every piece of data it keeps, who else touches it, and how to get it all deleted."
    >
      <h2>Who this covers</h2>
      <p>
        This policy covers sendtally.com, the sendtally API, and the sendtally mobile apps.
        sendtally is operated by an individual sole proprietor trading as sendtally, who is the data
        controller for the information described here. It sits alongside the{" "}
        <a href="/terms">terms of service</a>.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Your account.</strong> Your email address and account identifier, held by our
        authentication provider Clerk. sendtally&rsquo;s own database stores only the Clerk
        identifier, your timezone and the date you signed up. We never see or store a password.
      </p>
      <p>
        <strong>Your logbook.</strong> Everything you type into the log-session form: date, start
        and end time, location, session name, each climb with its grade, whether you sent or
        attempted it and how many tries, plus any tags you create and any effort rating you set
        yourself. Alongside it we store the effort score, title and summary computed from that
        session.
      </p>
      <p>
        <strong>Your Areas contributions, only if you make any.</strong> The areas and climbs you
        add to the shared Areas directory, the edits you suggest, and the duplicate and issue
        reports you send, each recorded against your account identifier so moderators can review
        them. Approved contributions are public; who made them is not shown.
      </p>
      <p>
        <strong>Your Strava connection, only if you make one.</strong> Your Strava athlete
        identifier, the access and refresh tokens, and the identifier of each activity we have
        posted for you.
      </p>
      <p>
        <strong>Usage.</strong> Standard web analytics through Google Analytics and PostHog (pages
        and app screens viewed, approximate region, device and browser), and the request logs
        Cloudflare keeps for the sites and API it serves us. Once you sign in, PostHog records your
        account identifier and email address against that usage, so we can tell how many people are
        using a feature rather than how many browsers are. PostHog also records screen replays of
        app sessions and the errors your browser hits, so we can see what broke. Those replays show
        what you type, except passwords; in the mobile app photos and system pickers stay masked.
        Adding to Areas and moderating it are recorded as events too, such as an area created, an
        edit suggested, or a report resolved, carrying only the kind of action and a few labels,
        such as whether it was an area or a climb, never what you wrote.
      </p>
      <p>
        <strong>App installs.</strong> The mobile apps also run Google Analytics for Firebase, which
        records that the app was installed and opened, how long it is used, the device model,
        operating system, app version and approximate region, against an identifier for that
        installation of the app. It also records two events of ours, an account created and a
        membership started, carrying only which store and which plan the membership came from. None
        of this is tied to your account identifier or email address. On Android it includes the
        device&rsquo;s advertising ID, which you can reset or delete in your phone&rsquo;s settings.
        On iPhone it never includes the advertising identifier, and the app never asks to track you.
      </p>

      <h2>What we never collect</h2>
      <p>
        We never ask for, receive or store a password for any third-party service. Strava is
        connected over OAuth, so your Strava credentials never pass through sendtally.
      </p>
      <p>
        We do not import your climbing from any third party. Your logbook contains only what you
        entered yourself. We do not track your location in the background, read your contacts, or
        collect health data from other apps. We do not sell your data or share it with data brokers.
        The only thing an advertising platform learns from sendtally is whether a store badge tap,
        an install, a new account or a membership followed one of our own ads, as described under
        Google below.
      </p>

      <h2>Why we hold it</h2>
      <ul>
        <li>
          To show you your logbook, and to compute the effort score and the trends from your own
          past sessions.
        </li>
        <li>To sign you in and keep your account secure.</li>
        <li>
          To post sessions to Strava when you have connected it and turned posting on, and only for
          the sessions you chose to post.
        </li>
        <li>To take payment for membership and tell you what you are subscribed to.</li>
        <li>
          To answer your emails, and to send you service notices such as a broken Strava connection.
        </li>
        <li>To understand roughly how the site is used, so it can be improved.</li>
        <li>
          To learn which of our own ads lead people to install the app, create an account or become
          a member.
        </li>
      </ul>

      <h2>Who else touches it</h2>
      <p>
        Six processors, each handling only what it needs, and each processing data on our
        instructions.
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> - authentication and billing on the web. Holds your email address
          and account, and processes membership payments made on sendtally.com through its payment
          processor.
        </li>
        <li>
          <strong>RevenueCat</strong> - membership bought in the mobile app. The app store takes the
          payment; RevenueCat validates the purchase and tells us whether your membership is active.
          It sees your account identifier and purchase history, never your card details, which stay
          with Google or Apple.
        </li>
        <li>
          <strong>Cloudflare</strong> - hosting, the database that stores your logbook, and network
          protection for both the site and the API.
        </li>
        <li>
          <strong>Strava</strong> - only if you connect it, and only to post the activities you have
          asked for. Strava&rsquo;s consent screen also asks for activity read access; sendtally
          does not read your Strava activities.
        </li>
        <li>
          <strong>Google</strong> - Google Analytics on sendtally.com and Google Analytics for
          Firebase in the mobile apps, plus Google Ads to measure our own ads. For visitors who
          arrive from one of our ads, the site reports whether they go on to tap an app store badge
          or create an account; the apps report installs, new accounts and membership starts. That
          is measurement only: ad personalization is turned off, so it is never used for retargeting
          or personalized ads, and your logbook, email address and account identifier are never
          sent. On iPhone, installs from our ads are reported through Apple&rsquo;s SKAdNetwork,
          which carries no identifier for you or your device.
        </li>
        <li>
          <strong>PostHog</strong> - product analytics, session replay and error reports, including
          your account identifier and email address once you are signed in. Your logbook is not sent
          to PostHog.
        </li>
      </ul>
      <p>
        Activities you post to Strava are governed by your Strava privacy settings from that point
        on. You can revoke our access from Strava at any time, and posting stops.
      </p>

      <h2>How it is protected</h2>
      <p>
        Everything travels over HTTPS. Your logbook is stored in a Cloudflare D1 database keyed to
        your account, and every query is scoped to your account identifier.
      </p>
      <p>
        Strava access and refresh tokens are encrypted with AES-GCM before they are written to the
        database. The encryption key lives in a server-side secret that is never sent to a browser
        or app, so the stored tokens are useless on their own.
      </p>
      <p>
        No system is perfectly secure, and we cannot promise the service will never be breached. If
        a breach affects your data, we will tell you.
      </p>

      <h2>Where it is held</h2>
      <p>
        sendtally is hosted on Cloudflare&rsquo;s global network, and your data may be stored and
        processed in the United States and other countries where our providers operate. Wherever it
        sits, it is handled under this policy.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Your logbook is kept for as long as your account is open, because it is the history the
        trends are built from. We do not expire or thin it out.
      </p>
      <p>
        Deleting your account removes every session, tag and effort score we hold for you, revokes
        and deletes your Strava tokens, deletes your record at RevenueCat, and closes your sign-in.
        A subscription bought through an app store is canceled from that store, not by deleting your
        account. It happens the same day, with no soft-delete or recovery window. Residual copies
        may persist in encrypted backups for a short period before they roll off. If you delete your
        account from Clerk&rsquo;s own portal instead, a webhook triggers the same purge on our
        side.
      </p>
      <p>
        Contributions to Areas are the one exception. Areas and climbs a moderator has approved, and
        the approved edits you suggested, stay in the directory because other climbers&rsquo;
        logbooks point at them, but your account identifier is removed from every one of them, so
        they no longer link back to you. Contributions and edit suggestions still awaiting review,
        and the reports you sent, are deleted with the rest.
      </p>
      <p>
        Usage records at PostHog are not part of that purge. They age off on their own after twelve
        months, and session replays after thirty days. Write to us if you want yours removed sooner
        and we will delete them.
      </p>
      <p>
        Google Analytics for Firebase records are not linked to your account, so there is nothing
        there for the purge to find. Google keeps them for two months, after which only aggregate
        counts remain.
      </p>
      <p>
        Activities already posted to Strava live in your Strava account and stay there. Delete those
        in Strava if you want them gone.
      </p>

      <h2>Cookies</h2>
      <p>
        Clerk sets a session cookie so you stay signed in. It is required for the service to work.
      </p>
      <p>
        Google Analytics and PostHog set cookies to count visits and sessions and to join the pages
        you visit into one session. When you arrive from one of our ads, Google Ads sets a cookie
        holding that ad click, so a later store badge tap or sign-up can be counted against the ad.
        We do not run retargeting pixels or third-party trackers beyond what is described here.
      </p>

      <h2>Your rights</h2>
      <p>
        You can see your whole logbook in the app at any time, correct any session by editing it,
        and delete everything from settings without asking us.
      </p>
      <p>
        Depending on where you live you may also have the right to a copy of your data in a portable
        form, to object to or restrict processing, or to complain to your data protection authority.
        To exercise any of these, or to ask for a data export, write to us and we will respond
        within thirty days.
      </p>
      <p>
        We do not sell personal information, and we do not share it for cross-context behavioral
        advertising.
      </p>

      <h2>Children</h2>
      <p>
        sendtally is not for people under 16. We do not knowingly collect data from anyone under
        that age. If you believe a child has an account, write to us and we will delete it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We will update this page when what we collect or who processes it changes, and the date at
        the top always shows the current version. Material changes are announced by email or in the
        app before they take effect.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions, data requests and complaints go to <a href="/support">support</a>, or{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
