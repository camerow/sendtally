import React from "react";
import type { LinksFunction } from "react-router";
import { LegalPage, legalLinks } from "../legal/components/LegalPage";
import { pageMeta } from "../lib/seo";

export const links: LinksFunction = legalLinks;

export function meta(): Array<Record<string, string>> {
  return pageMeta({
    title: "Use Claude or ChatGPT with your climbing log - sendtally",
    description:
      "Connect Claude or ChatGPT to sendtally to import an old climbing log or spreadsheet, and to build workouts and training blocks from your climbing history.",
    path: "/ai-assistants",
  });
}

export default function AiAssistants(): React.ReactElement {
  return (
    <LegalPage
      title="AI assistants"
      updated="13 NOVEMBER 2026"
      lede="Connect Claude or ChatGPT to your sendtally account and ask it to do the tedious parts of keeping a climbing log for you."
    >
      <h2>Import an old climbing log</h2>
      <p>
        Hand the assistant a spreadsheet, a journal or an export you made from another climbing app,
        and ask it to bring your history in. It reads the file, turns each day into a session with
        its climbs, grades, sends and attempts, and adds them to your logbook. Every session is
        scored for effort the same way as one you log yourself.
      </p>

      <h2>Build workouts and training blocks</h2>
      <p>
        The assistant can read your sessions, your training library and your plan. Ask it to look at
        what you have been climbing and put together exercises, workouts or a training block that
        fits, and it saves them to your library ready to use.
      </p>

      <h2>What it cannot do</h2>
      <p>
        A connected assistant can add to your account but never edit or delete anything already
        there. It works only with files you give it: sendtally never fetches your data from another
        service.
      </p>

      <h2>Connect</h2>
      <p>
        Sign in on sendtally.com and open Settings, then Connect an AI assistant. That page has the
        connector URL to paste into Claude or ChatGPT and the steps for each. You sign in to
        sendtally from the assistant, so your password is never shared with it.
      </p>

      <h2>Disconnect</h2>
      <p>
        Remove sendtally from the assistant&rsquo;s own connector settings. Its access ends straight
        away. Sessions and training it already added stay in your account until you delete them.
      </p>

      <h2>Cost</h2>
      <p>
        Connecting is free, and so are reading your log and importing sessions. Saving exercises,
        workouts and training blocks follows the same trial and membership as doing it in the app.
      </p>
    </LegalPage>
  );
}
