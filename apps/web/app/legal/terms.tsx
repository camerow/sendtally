import React from "react";
import { ContactLink, GOVERNING_STATE, PRIVACY_PATH } from "./constants";
import type { LegalDocument } from "./types";

export const TERMS: LegalDocument = {
  title: "Terms of service",
  lede: "sendtally is a climbing logbook run by one person. These terms say what you can expect from it, what it expects from you, and what happens if either of us walks away.",
  effective: "8 September 2026",
  sections: [
    {
      heading: "Agreeing to these terms",
      body: [
        "sendtally is operated by an individual sole proprietor trading as sendtally (“we”, “us”). By creating an account or using sendtally.com or the sendtally mobile apps (together, the “service”) you agree to these terms.",
        <>
          If you do not agree, do not use the service. If you are using sendtally on behalf of an
          organisation, you confirm you can bind that organisation to these terms. Questions go to{" "}
          <ContactLink />.
        </>,
      ],
    },
    {
      heading: "What sendtally does",
      body: [
        "sendtally is a log of your climbing sessions. You record each session yourself: the climbs, their grades, whether you sent or attempted them, how many tries, the location, and the time. sendtally scores each session for effort on a 1-10 scale against your own recent history, and turns the sessions you have logged into trends over time.",
        "Everything in your logbook comes from the form you fill in. sendtally does not import your climbing from any third-party board app, gym system or tracker, and does not read data from any account other than the ones you explicitly connect.",
        "The one thing sendtally writes outward is Strava: if you connect Strava and turn posting on, each session you log is posted to your Strava account as a Rock Climbing activity.",
      ],
    },
    {
      heading: "Your account",
      body: [
        "Accounts are created and secured through our authentication provider, Clerk, using a one-time code sent to your email address. There is no sendtally password, so keeping your email account secure is what keeps your logbook secure.",
        "You must be at least 16 years old to hold an account. One account is for one person: do not share your account or let anyone else sign in as you. You are responsible for what happens under your account.",
        "Tell us at once if you believe someone else has access to your account.",
      ],
    },
    {
      heading: "Your logbook is yours",
      body: [
        "You keep every right you already have in the sessions, climbs, names, notes and tags you enter. We claim no ownership of them.",
        "You grant us a limited, non-exclusive, worldwide, royalty-free licence to store, copy, process and display that content, solely so we can run the service for you: showing your logbook back to you, computing your effort scores and trends, and posting to Strava when you have asked us to. The licence lasts as long as you keep the content in sendtally and ends when you delete it. We do not sell your logbook and we do not publish it.",
        "You are responsible for what you enter. Do not put anything in your logbook that you do not have the right to store, or that is unlawful.",
      ],
    },
    {
      heading: "Free use and membership",
      body: [
        "Logging sessions, keeping your logbook, the effort score on each session and Strava posting are free, and are intended to stay free.",
        "Membership is a paid subscription that unlocks the long-term trend screens. It is billed in advance on a recurring monthly basis through our billing provider, Clerk, and renews automatically until you cancel. Cancel any time from your account settings: your membership then runs to the end of the period you have already paid for and does not renew.",
        "We do not pro-rate or refund part-used periods except where the law requires it. If we change the price, we will tell you before it applies to you, and the change takes effect at your next renewal. If we ever discontinue membership, we will stop billing and let you keep using the service on the free tier.",
        "Taxes, where they apply, are your responsibility unless we state otherwise at checkout.",
      ],
    },
    {
      heading: "Connecting Strava",
      body: [
        "Connecting Strava is optional and always reversible. The connection is made over Strava's standard OAuth flow, so your Strava password never passes through sendtally. You can disconnect from sendtally's settings or revoke access from inside Strava at any time.",
        "While the connection is on and posting is enabled, you are instructing us to create activities in your Strava account on your behalf. Each session is posted once. Editing a session in sendtally never posts a second activity.",
        "Activities we have already posted belong to your Strava account. Disconnecting Strava, or deleting your sendtally account, does not remove them: delete those in Strava yourself if you want them gone. Your use of Strava is governed by Strava's own terms and privacy policy, not ours.",
        "sendtally is not affiliated with, endorsed by, or sponsored by Strava.",
      ],
    },
    {
      heading: "How you may use the service",
      body: ["When using sendtally, do not:"],
      bullets: [
        "scrape, crawl, or make automated bulk requests to the service or its API outside the apps we provide",
        "resell, sublicense or redistribute the service, or use it to build a competing product",
        "attempt to access another user's logbook, or any part of the system you have not been granted access to",
        "probe, overload, or interfere with the service, or work around any rate limit or access control",
        "use the service to break someone else's terms, including those of Strava or any climbing gym or board provider",
        "upload anything unlawful, abusive, or infringing",
      ],
    },
    {
      heading: "Availability and change",
      body: [
        "sendtally is a small project run by one person. It is offered as it is, with no uptime guarantee and no service level commitment.",
        "We may add, change, or remove features, and we may suspend the service for maintenance. Where a change materially reduces what you are paying for, we will give you notice and you can cancel.",
        "If we ever shut the service down, we will give you reasonable notice and a way to export your logbook before it goes.",
      ],
    },
    {
      heading: "Leaving, and deletion",
      body: [
        "You can delete your account from settings at any time. Deleting removes every session you have logged, disconnects and revokes Strava, and closes your sign-in. It happens the same day and cannot be undone.",
        <>
          Activities already posted to Strava stay on Strava. What we hold, for how long, and what
          leaves with you is set out in the <a href={PRIVACY_PATH}>privacy policy</a>.
        </>,
        "We may suspend or close your account if you breach these terms, if we are required to by law, or if keeping it open would put the service or other users at risk. Where it is reasonable to do so, we will tell you first.",
      ],
    },
    {
      heading: "Not training or medical advice",
      body: [
        "The effort score, trends and session summaries sendtally produces are a description of what you have logged. They are not coaching, training prescription, or medical advice, and they cannot tell you whether it is safe for you to climb.",
        "Climbing is dangerous and you take part at your own risk. Decisions about training load, rest, injury and safety are yours, and are best made with a qualified coach or clinician. Do not rely on sendtally for them.",
      ],
    },
    {
      heading: "No warranty",
      body: [
        "To the fullest extent permitted by law, the service is provided “as is” and “as available”, without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.",
        "We do not warrant that the service will be uninterrupted, timely, secure or error-free, that the effort scores or trends are accurate, or that data will never be lost. Keep your own copy of anything you cannot afford to lose.",
      ],
    },
    {
      heading: "Limits on liability",
      body: [
        "To the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, lost data, or personal injury arising from your use of the service.",
        "Our total liability for all claims relating to the service is limited to the greater of the amount you paid us in the twelve months before the claim arose, or fifty United States dollars.",
        "Some jurisdictions do not allow these limits, in which case they apply to you only to the extent permitted. Nothing here limits liability that cannot lawfully be limited.",
      ],
    },
    {
      heading: "Indemnity",
      body: [
        "You agree to indemnify and hold us harmless from claims, losses and reasonable legal costs arising out of the content you put into sendtally, your use of the service, or your breach of these terms.",
      ],
    },
    {
      heading: "Changes to these terms",
      body: [
        "We may update these terms as the service changes. The effective date at the top of this page always shows the current version.",
        <>
          For material changes we will give notice by email or in the app before they take effect.
          Continuing to use sendtally after that means you accept the updated terms. If you do not,
          delete your account or write to <ContactLink />.
        </>,
      ],
    },
    {
      heading: "Governing law",
      body: [
        `These terms are governed by the laws of the State of ${GOVERNING_STATE}, United States, without regard to its conflict of law rules. The state and federal courts located in ${GOVERNING_STATE} have exclusive jurisdiction over any dispute arising from them, and you consent to that jurisdiction.`,
        "If any part of these terms is found unenforceable, the rest stays in force. Our not enforcing a right is not a waiver of it. These terms, together with the privacy policy, are the whole agreement between us about the service.",
      ],
    },
    {
      heading: "Contact",
      body: [
        <>
          Questions about these terms, or anything else about sendtally, go to <ContactLink />. It
          is one person reading them, and every one gets a reply.
        </>,
      ],
    },
  ],
};
