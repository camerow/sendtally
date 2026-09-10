import React from "react";
import type { LinksFunction } from "react-router";
import { LegalPage, legalLinks } from "../legal/components/LegalPage";
import { CONTACT_EMAIL, GOVERNING_STATE } from "../legal/constants";
import { pageMeta } from "../lib/seo";

export const links: LinksFunction = legalLinks;

export function meta(): Array<Record<string, string>> {
  return pageMeta({
    title: "Terms of service - sendtally",
    description:
      "The terms you agree to when you use sendtally: what the service does, what membership costs, how Strava posting works, and how to leave.",
    path: "/terms",
  });
}

export default function Terms(): React.ReactElement {
  return (
    <LegalPage
      title="Terms of service"
      updated="9 SEPTEMBER 2026"
      lede="sendtally is a climbing logbook run by one person. These terms say what you can expect from it, what it expects from you, and what happens if either of us walks away."
    >
      <h2>Agreeing to these terms</h2>
      <p>
        sendtally is operated by an individual sole proprietor trading as sendtally
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using sendtally.com or the
        sendtally mobile apps (together, the &ldquo;service&rdquo;) you agree to these terms.
      </p>
      <p>
        If you do not agree, do not use the service. If you are using sendtally on behalf of an
        organisation, you confirm you can bind that organisation to these terms.
      </p>

      <h2>What sendtally does</h2>
      <p>
        sendtally is a log of your climbing sessions. You record each session yourself: the climbs,
        their grades, whether you sent or attempted them, how many tries, the location and the time.
        sendtally scores each session for effort on a 1-10 scale against your own recent history,
        and turns the sessions you have logged into trends over time.
      </p>
      <p>
        Everything in your logbook comes from the form you fill in. sendtally does not import your
        climbing from any third party, and does not read data from any account other than the ones
        you explicitly connect.
      </p>
      <p>
        The one thing sendtally writes outward is Strava: if you connect Strava and turn posting on,
        each session you log is posted to your Strava account as a Rock Climbing activity.
      </p>

      <h2>Your account</h2>
      <p>
        Accounts are created and secured through our authentication provider, Clerk, using a
        one-time code sent to your email address. There is no sendtally password, so keeping your
        email account secure is what keeps your logbook secure.
      </p>
      <p>
        You must be at least 16 years old to hold an account. One account is for one person: do not
        share your account or let anyone else sign in as you. You are responsible for what happens
        under your account, and you should tell us at once if you believe someone else has access to
        it.
      </p>

      <h2>Your logbook is yours</h2>
      <p>
        You keep every right you already have in the sessions, climbs, names, notes and tags you
        enter. We claim no ownership of them.
      </p>
      <p>
        You grant us a limited, non-exclusive, worldwide, royalty-free licence to store, copy,
        process and display that content, solely so we can run the service for you: showing your
        logbook back to you, computing your effort scores and trends, and posting to Strava when you
        have asked us to. The licence lasts as long as you keep the content in sendtally and ends
        when you delete it. We do not sell your logbook and we do not publish it.
      </p>
      <p>
        You are responsible for what you enter. Do not put anything in your logbook that you do not
        have the right to store, or that is unlawful.
      </p>

      <h2>Free use and membership</h2>
      <p>
        Logging sessions, keeping your logbook, the effort score on each session and Strava posting
        are free, and are intended to stay free.
      </p>
      <p>
        Membership is a paid subscription that unlocks the long-term trend screens. It is billed in
        advance, monthly or yearly, and renews automatically until you cancel. On sendtally.com it
        is billed through our billing provider, Clerk; in the mobile app it is billed through the
        app store you bought it from (Google Play or the App Store), under that store&rsquo;s terms.
        Cancel any time from your account settings on the web, or from your app store subscriptions
        for a membership bought in the app: your membership then runs to the end of the period you
        have already paid for and does not renew. A membership bought in one place unlocks the
        trends everywhere you sign in.
      </p>
      <p>
        We do not pro-rate or refund part-used periods except where the law requires it. If we
        change the price, we will tell you before it applies to you, and the change takes effect at
        your next renewal. If we ever discontinue membership, we will stop billing and let you keep
        using the service on the free tier. Taxes, where they apply, are your responsibility unless
        we state otherwise at checkout.
      </p>

      <h2>Connecting Strava</h2>
      <p>
        Connecting Strava is optional and always reversible. The connection is made over
        Strava&rsquo;s standard OAuth flow, so your Strava password never passes through sendtally.
        You can disconnect from sendtally&rsquo;s settings or revoke access from inside Strava at
        any time.
      </p>
      <p>
        While the connection is on and posting is enabled, you are instructing us to create
        activities in your Strava account on your behalf. Each session is posted once. Editing a
        session in sendtally never posts a second activity.
      </p>
      <p>
        Activities we have already posted belong to your Strava account. Disconnecting Strava, or
        deleting your sendtally account, does not remove them: delete those in Strava yourself if
        you want them gone. Your use of Strava is governed by Strava&rsquo;s own terms and privacy
        policy, not ours. sendtally is not affiliated with, endorsed by, or sponsored by Strava.
      </p>

      <h2>How you may use the service</h2>
      <p>When using sendtally, do not:</p>
      <ul>
        <li>
          scrape, crawl, or make automated bulk requests to the service or its API outside the apps
          we provide
        </li>
        <li>
          resell, sublicense or redistribute the service, or use it to build a competing product
        </li>
        <li>
          attempt to access another user&rsquo;s logbook, or any part of the system you have not
          been granted access to
        </li>
        <li>
          probe, overload, or interfere with the service, or work around any rate limit or access
          control
        </li>
        <li>
          use the service to break someone else&rsquo;s terms, including those of Strava or any
          climbing gym
        </li>
        <li>upload anything unlawful, abusive, or infringing</li>
      </ul>

      <h2>Availability and change</h2>
      <p>
        sendtally is a small project run by one person. It is offered as it is, with no uptime
        guarantee and no service level commitment.
      </p>
      <p>
        We may add, change, or remove features, and we may suspend the service for maintenance.
        Where a change materially reduces what you are paying for, we will give you notice and you
        can cancel. If we ever shut the service down, we will give you reasonable notice and a way
        to export your logbook before it goes.
      </p>

      <h2>Leaving, and deletion</h2>
      <p>
        You can delete your account from settings at any time. Deleting removes every session you
        have logged, disconnects and revokes Strava, and closes your sign-in. It happens the same
        day and cannot be undone.
      </p>
      <p>
        Activities already posted to Strava stay on Strava. What we hold, for how long, and what
        leaves with you is set out in the <a href="/privacy">privacy policy</a>.
      </p>
      <p>
        We may suspend or close your account if you breach these terms, if we are required to by
        law, or if keeping it open would put the service or other users at risk. Where it is
        reasonable to do so, we will tell you first.
      </p>

      <h2>Not training or medical advice</h2>
      <p>
        The effort score, trends and session summaries sendtally produces are a description of what
        you have logged. They are not coaching, training prescription, or medical advice, and they
        cannot tell you whether it is safe for you to climb.
      </p>
      <p>
        Climbing is dangerous and you take part at your own risk. Decisions about training load,
        rest, injury and safety are yours, and are best made with a qualified coach or clinician. Do
        not rely on sendtally for them.
      </p>

      <h2>No warranty</h2>
      <p>
        To the fullest extent permitted by law, the service is provided &ldquo;as is&rdquo; and
        &ldquo;as available&rdquo;, without warranties of any kind, express or implied, including
        merchantability, fitness for a particular purpose, and non-infringement.
      </p>
      <p>
        We do not warrant that the service will be uninterrupted, timely, secure or error-free, that
        the effort scores or trends are accurate, or that data will never be lost. Keep your own
        copy of anything you cannot afford to lose.
      </p>

      <h2>Limits on liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for indirect, incidental, special,
        consequential or punitive damages, or for lost profits, lost data, or personal injury
        arising from your use of the service.
      </p>
      <p>
        Our total liability for all claims relating to the service is limited to the greater of the
        amount you paid us in the twelve months before the claim arose, or fifty United States
        dollars. Some jurisdictions do not allow these limits, in which case they apply to you only
        to the extent permitted. Nothing here limits liability that cannot lawfully be limited.
      </p>

      <h2>Indemnity</h2>
      <p>
        You agree to indemnify and hold us harmless from claims, losses and reasonable legal costs
        arising out of the content you put into sendtally, your use of the service, or your breach
        of these terms.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms as the service changes. The date at the top of this page always
        shows the current version.
      </p>
      <p>
        For material changes we will give notice by email or in the app before they take effect.
        Continuing to use sendtally after that means you accept the updated terms. If you do not,
        delete your account or write to us.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the State of {GOVERNING_STATE}, United States,
        without regard to its conflict of law rules. The state and federal courts located in{" "}
        {GOVERNING_STATE} have exclusive jurisdiction over any dispute arising from them, and you
        consent to that jurisdiction.
      </p>
      <p>
        If any part of these terms is found unenforceable, the rest stays in force. Our not
        enforcing a right is not a waiver of it. These terms, together with the privacy policy, are
        the whole agreement between us about the service.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="/support">Support</a>, or <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        It is one person reading them, and every one gets a reply.
      </p>
    </LegalPage>
  );
}
