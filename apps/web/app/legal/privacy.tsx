import React from "react";
import { ContactLink, TERMS_PATH } from "./constants";
import type { LegalDocument } from "./types";

export const PRIVACY: LegalDocument = {
  title: "Privacy policy",
  lede: "sendtally holds the climbing sessions you type in and almost nothing else. This page lists every piece of data it keeps, who else touches it, and how to get it all deleted.",
  effective: "8 September 2026",
  sections: [
    {
      heading: "Who this covers",
      body: [
        "This policy covers sendtally.com, the sendtally API, and the sendtally mobile apps. sendtally is operated by an individual sole proprietor trading as sendtally, who is the data controller for the information described here.",
        <>
          It sits alongside the <a href={TERMS_PATH}>terms of service</a>. For anything not answered
          here, write to <ContactLink />.
        </>,
      ],
    },
    {
      heading: "What we collect",
      body: ["There are four sources of data, and no others:"],
      bullets: [
        "Account: your email address and account identifier, held by our authentication provider Clerk. sendtally's own database stores only the Clerk identifier, your timezone and the date you signed up. We never see or store a password.",
        "Your logbook: everything you type into the log-session form - date, start and end time, location, session name, each climb with its grade, whether you sent or attempted it and how many tries, plus any tags you create and any effort rating you set yourself. Alongside it we store the effort score, title and summary computed from that session.",
        "Strava connection, only if you connect it: your Strava athlete identifier, the access and refresh tokens, and the identifier of each activity we have posted for you.",
        "Usage: standard web analytics through Google Analytics (pages viewed, approximate region, device and browser), and the request logs Cloudflare keeps for the sites and API it serves us.",
      ],
    },
    {
      heading: "What we never collect",
      body: [
        "We never ask for, receive or store a password for any third-party service. Strava is connected over OAuth, so your Strava credentials never pass through sendtally.",
        "We do not import your climbing from any board app, gym system or tracker. Your logbook contains only what you entered yourself.",
        "We do not track your location, read your contacts, or run background collection of any kind. We do not sell your data, and we do not share it with advertisers or data brokers.",
      ],
    },
    {
      heading: "Why we hold it",
      body: ["We use what we hold only to run the service:"],
      bullets: [
        "to show you your logbook, and to compute the effort score and the trends from your own past sessions",
        "to sign you in and keep your account secure",
        "to post sessions to Strava when you have connected it and turned posting on",
        "to take payment for membership and tell you what you are subscribed to",
        "to answer your emails, and to send you service notices such as a broken Strava connection",
        "to understand roughly how the site is used, so it can be improved",
      ],
    },
    {
      heading: "Who else touches it",
      body: [
        "sendtally runs on a small number of providers, each handling only what it needs. They process data on our instructions.",
      ],
      bullets: [
        <>
          <strong>Clerk</strong> - authentication and billing. Holds your email address and account,
          and processes membership payments through its payment processor. See{" "}
          <a href="https://clerk.com/legal/privacy" rel="noreferrer">
            Clerk's privacy policy
          </a>
          .
        </>,
        <>
          <strong>Cloudflare</strong> - hosting, the database that stores your logbook, and network
          protection for both the site and the API. See{" "}
          <a href="https://www.cloudflare.com/privacypolicy/" rel="noreferrer">
            Cloudflare's privacy policy
          </a>
          .
        </>,
        <>
          <strong>Strava</strong> - only if you connect it, and only to post the activities you have
          asked for. Strava's consent screen also asks for activity read access; sendtally does not
          read your Strava activities. Your use of Strava is governed by{" "}
          <a href="https://www.strava.com/legal/privacy" rel="noreferrer">
            Strava's privacy policy
          </a>
          .
        </>,
        <>
          <strong>Google Analytics</strong> - aggregate web analytics for sendtally.com. See{" "}
          <a href="https://policies.google.com/privacy" rel="noreferrer">
            Google's privacy policy
          </a>
          .
        </>,
      ],
    },
    {
      heading: "How it is protected",
      body: [
        "Everything travels over HTTPS. Your logbook is stored in a Cloudflare D1 database keyed to your account, and every query is scoped to your account identifier.",
        "Strava access and refresh tokens are encrypted with AES-GCM before they are written to the database. The encryption key lives in a server-side secret that is never sent to a browser or app, so the stored tokens are useless on their own.",
        "No system is perfectly secure, and we cannot promise the service will never be breached. If a breach affects your data, we will tell you.",
      ],
    },
    {
      heading: "Where it is held",
      body: [
        "sendtally is hosted on Cloudflare's global network and your data may be stored and processed in the United States and other countries where our providers operate. Wherever it sits, it is handled under this policy.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Your logbook is kept for as long as your account is open, because it is the history the trends are built from. We do not expire or thin it out.",
        "Deleting your account removes every session, tag and effort score we hold for you, revokes and deletes your Strava tokens, and closes your sign-in. It happens the same day. Residual copies may persist in encrypted backups for a short period before they roll off.",
        "Activities already posted to Strava live in your Strava account and stay there. Delete those in Strava if you want them gone.",
      ],
    },
    {
      heading: "Cookies",
      body: [
        "Clerk sets a session cookie so you stay signed in. It is required for the service to work.",
        "Google Analytics sets cookies to count visits and sessions on the marketing pages. We do not run advertising cookies, retargeting pixels, or third-party trackers beyond the analytics described here.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "You can see your whole logbook in the app at any time, correct any session by editing it, and delete everything from settings without asking us.",
        <>
          Depending on where you live you may also have the right to a copy of your data in a
          portable form, to object to or restrict processing, or to complain to your data protection
          authority. To exercise any of these, or to ask for a data export, write to <ContactLink />
          . We will respond within thirty days.
        </>,
        "We do not sell personal information, and we do not share it for cross-context behavioural advertising.",
      ],
    },
    {
      heading: "Children",
      body: [
        "sendtally is not for people under 16. We do not knowingly collect data from anyone under that age. If you believe a child has an account, write to us and we will delete it.",
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "We will update this page when what we collect or who processes it changes, and the effective date at the top always shows the current version. Material changes are announced by email or in the app before they take effect.",
      ],
    },
    {
      heading: "Contact",
      body: [
        <>
          Privacy questions, data requests and complaints all go to <ContactLink />.
        </>,
      ],
    },
  ],
};
