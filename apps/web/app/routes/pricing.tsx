import React from "react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import type { Locale } from "@sendtally/features/i18n";
import { isSignedIn } from "../auth/session.server";
import { requestLocale } from "../lib/locale";
import { pageMeta } from "../lib/seo";
import { CompareTable } from "../landing/components/CompareTable";
import { Closing } from "../landing/components/Closing";
import { Faq } from "../landing/components/Faq";
import { Footer } from "../landing/components/Footer";
import { Nav } from "../landing/components/Nav";
import { PageHeader } from "../landing/components/PageHeader";
import { PlanCards } from "../landing/components/PlanCards";
import { COPIES } from "../landing/copies";
import { LandingProvider } from "../landing/LandingContext";
import { storePlatform, type StorePlatform } from "../lib/stores";
import landingStyles from "../landing/landing.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: landingStyles }];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const copy = COPIES[data?.locale ?? "en"];
  return pageMeta({
    title: copy.pricing.meta.title,
    description: copy.pricing.meta.description,
    path: "/pricing",
    locale: data?.locale ?? "en",
  });
};

type LoaderData = { signedIn: boolean; locale: Locale; platform: StorePlatform };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return {
    signedIn: await isSignedIn(args),
    locale: requestLocale(args.request),
    platform: storePlatform(args.request.headers.get("user-agent")),
  };
}

export default function Pricing(): React.ReactElement {
  const loaderData = useLoaderData<typeof loader>();
  const { pricing } = COPIES[loaderData.locale];
  return (
    <LandingProvider
      signedIn={loaderData.signedIn}
      locale={loaderData.locale}
      platform={loaderData.platform}
    >
      <Nav current="pricing" />
      <main>
        <PageHeader eyebrow={pricing.eyebrow} title={pricing.title} body={pricing.body} />
        <PlanCards />
        <CompareTable />
        <Faq title={pricing.faq.title} items={pricing.faq.items} />
        <Closing title={pricing.closing.title} webAccount={pricing.closing.webAccount} />
      </main>
      <Footer stores={false} />
    </LandingProvider>
  );
}
