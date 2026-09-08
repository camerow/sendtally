import React from "react";
import type { LinksFunction } from "react-router";
import { LegalPage, legalLinks } from "../legal/components/LegalPage";

export const links: LinksFunction = legalLinks;

export function meta(): Array<Record<string, string>> {
  return [
    { title: "Terms of service - sendtally" },
    {
      name: "description",
      content:
        "The terms you agree to when you use sendtally: what the service does, what membership covers, and how either side can end it.",
    },
  ];
}

export default function Terms(): React.ReactElement {
  return (
    <LegalPage
      title="Terms of service"
      updated="8 SEPTEMBER 2026"
      lede="Short version: log your sessions, keep your account tidy, and do not try to break the service for anyone else. Membership is optional and cancellable."
    >
      <h2>The service</h2>
      <p>
        sendtally records climbing sessions you enter yourself, scores each one for effort, and can
        post them to Strava on your behalf. Logging sessions, the effort score and Strava posting
        are free, and are intended to stay free.
      </p>

      <h2>Your account</h2>
      <p>
        You need an account, and you are responsible for what happens under it. One person per
        account. You keep ownership of the sessions you log. You can delete the account, and
        everything in it, from Settings at any time.
      </p>

      <h2>Membership</h2>
      <p>
        Membership unlocks the trends screens. It is billed through our web checkout on
        sendtally.com and renews until you cancel. Cancelling stops the next renewal and leaves you
        access for the rest of the period you already paid for. Subscriptions are managed on
        sendtally.com.
      </p>
      <p>
        Prices can change. If they do, the change applies from your next renewal and you will be
        told before it takes effect.
      </p>

      <h2>Strava</h2>
      <p>
        sendtally is not affiliated with Strava. Connecting Strava is your choice, uses OAuth, and
        can be revoked from Strava at any time. Activities posted on your behalf carry an
        attribution line. Your use of Strava is governed by their terms, not ours.
      </p>

      <h2>Fair use</h2>
      <p>
        Do not attempt to break, overload, or gain unauthorised access to the service, and do not
        use it to store anything unlawful. We may suspend an account that does.
      </p>

      <h2>Availability and liability</h2>
      <p>
        The service is provided as is. We aim to keep it running and your data intact, but we cannot
        promise it will never be unavailable or that no data will ever be lost, and our liability is
        limited to what you paid us in the previous twelve months. Keep your own record of anything
        you cannot afford to lose.
      </p>

      <h2>Ending it</h2>
      <p>
        You can stop using sendtally and delete your account whenever you like. We can end an
        account that breaches these terms, and will tell you why unless we are legally unable to.
      </p>

      <h2>Changes</h2>
      <p>
        If these terms change materially, the date at the top changes and we will say so in the app
        before the change applies to you.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="/support">Support</a>, or{" "}
        <a href="mailto:hello@sendtally.com">hello@sendtally.com</a>.
      </p>
    </LegalPage>
  );
}
