import React from "react";
import type { LinksFunction } from "react-router";
import { LegalPage, legalLinks } from "../legal/components/LegalPage";

export const links: LinksFunction = legalLinks;

export function meta(): Array<Record<string, string>> {
  return [
    { title: "Privacy policy - sendtally" },
    {
      name: "description",
      content:
        "What sendtally stores, why it stores it, and how to get all of it deleted. No passwords, no data sold, no advertising trackers.",
    },
  ];
}

export default function Privacy(): React.ReactElement {
  return (
    <LegalPage
      title="Privacy policy"
      updated="8 SEPTEMBER 2026"
      lede="sendtally is a climbing log. It holds the sessions you type in and the email address you sign in with. It does not sell your data, and it carries no advertising or analytics trackers."
    >
      <h2>What we store</h2>
      <p>
        <strong>Your email address.</strong> Sign-in runs through Clerk, which holds your email and
        sends the one-time codes you log in with. We never see or store a password, ours or anyone
        else&rsquo;s.
      </p>
      <p>
        <strong>The sessions you log.</strong> Every session you enter in the app: date, start and
        end time, location, the climbs with their grades, whether you sent or attempted them, tries,
        and any note or name you added. Each session is stored with the effort score, title and
        summary computed from it.
      </p>
      <p>
        <strong>Your Strava connection, if you make one.</strong> Connecting Strava is standard
        OAuth. We receive an access token and a refresh token, never your Strava password. Both are
        encrypted with AES-GCM before they are written to our database, and the key lives outside
        it.
      </p>
      <p>
        We do not collect your location in the background, your contacts, your photos, or your
        health data from any other app. The only source of session data is the form you fill in.
      </p>

      <h2>Why we store it</h2>
      <ul>
        <li>To show you your own sessions, history and trends.</li>
        <li>
          To score each session for effort, which is measured against your own previous sessions.
        </li>
        <li>
          To post a session to Strava as a Rock Climbing activity, only if you connected Strava and
          only for sessions you chose to post.
        </li>
        <li>To sign you in and keep you signed in.</li>
      </ul>

      <h2>Who else sees it</h2>
      <p>
        Three processors, each doing one job: Clerk for sign-in and identity, Cloudflare for hosting
        and the database, and Strava for the activities you choose to post. Nobody buys this data
        from us, because we do not sell it. There is no advertising network in the app.
      </p>
      <p>
        Activities you post to Strava are governed by your Strava privacy settings from that point
        on. You can revoke our access from Strava at any time, and the app will stop posting.
      </p>

      <h2>Deleting everything</h2>
      <p>
        Settings has a Delete account control. Using it revokes the Strava token, erases every row
        we hold for you (your sessions, your Strava connection, your sync state and your user
        record), and deletes your Clerk user. It happens the same day, and there is no soft-delete
        or recovery window.
      </p>
      <p>
        If you delete your account from Clerk&rsquo;s own portal instead, a webhook triggers the
        same purge on our side.
      </p>

      <h2>Where it lives</h2>
      <p>
        Data is stored in Cloudflare D1 and served from Cloudflare&rsquo;s network. Traffic is
        encrypted in transit. Strava tokens are additionally encrypted at rest.
      </p>

      <h2>Children</h2>
      <p>
        sendtally is not directed at children under 13, and we do not knowingly collect data from
        them.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes in a way that affects what we collect or who sees it, the date at the
        top changes and we will say so in the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, requests, or anything that looks wrong: <a href="/support">support</a>, or email{" "}
        <a href="mailto:hello@sendtally.com">hello@sendtally.com</a>.
      </p>
    </LegalPage>
  );
}
