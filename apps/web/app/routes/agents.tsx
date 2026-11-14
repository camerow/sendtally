import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { isSignedIn } from "../auth/session.server";
import { connectorUrl } from "../lib/connector";
import { pageMeta } from "../lib/seo";
import { AGENTS } from "../landing/agentsCopy";
import { Closing } from "../landing/components/Closing";
import { ConnectSteps } from "../landing/components/ConnectSteps";
import { CopyUrl } from "../landing/components/CopyUrl";
import { Faq } from "../landing/components/Faq";
import { FeatureSection } from "../landing/components/FeatureSection";
import { Footer } from "../landing/components/Footer";
import { Nav } from "../landing/components/Nav";
import { PageHeader } from "../landing/components/PageHeader";
import { LandingProvider } from "../landing/LandingContext";
import { storePlatform, type StorePlatform } from "../lib/stores";
import landingStyles from "../landing/landing.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: landingStyles }];

export function meta(): Array<Record<string, string>> {
  return pageMeta({
    title: AGENTS.meta.title,
    description: AGENTS.meta.description,
    path: "/agents",
  });
}

type LoaderData = { signedIn: boolean; platform: StorePlatform; url: string };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return {
    signedIn: await isSignedIn(args),
    platform: storePlatform(args.request.headers.get("user-agent")),
    url: connectorUrl(args),
  };
}

export default function Agents(): React.ReactElement {
  const { signedIn, platform, url } = useLoaderData<typeof loader>();
  return (
    <LandingProvider signedIn={signedIn} locale="en" platform={platform}>
      <Nav current="agents" />
      <main>
        <PageHeader eyebrow={AGENTS.eyebrow} title={AGENTS.title} body={AGENTS.body}>
          <CopyUrl url={url} />
          <a href="#connect" className="l-textlink l-textlink--plain">
            {AGENTS.setup}
          </a>
        </PageHeader>
        {AGENTS.features.map((feature, i) => (
          <FeatureSection key={feature.id} feature={feature} flip={i % 2 === 1} />
        ))}
        <ConnectSteps url={url} />
        <Faq title={AGENTS.faq.title} items={AGENTS.faq.items} />
        <Closing title={AGENTS.closing.title} webAccount={AGENTS.closing.webAccount} />
      </main>
      <Footer stores={false} />
    </LandingProvider>
  );
}
