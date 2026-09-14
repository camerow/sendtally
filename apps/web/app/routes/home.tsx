import { useAuth } from "@clerk/react-router";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import type { Locale } from "@sendtally/features/i18n";
import { isSignedIn } from "../auth/session.server";
import { landingLocale } from "../lib/locale";
import { landingPath, pageMeta, SITE_URL } from "../lib/seo";
import { Details } from "../landing/components/Details";
import { Footer } from "../landing/components/Footer";
import { FreeSection } from "../landing/components/FreeSection";
import { Hero } from "../landing/components/Hero";
import { HowItWorks } from "../landing/components/HowItWorks";
import { Insights } from "../landing/components/Insights";
import { Nav } from "../landing/components/Nav";
import { PhotoBand } from "../landing/components/PhotoBand";
import { PricePanel } from "../landing/components/PricePanel";
import { SessionBreakdown } from "../landing/components/SessionBreakdown";
import { StravaSection } from "../landing/components/StravaSection";
import { COPIES } from "../landing/copies";
import { LandingProvider } from "../landing/LandingContext";
import landingStyles from "../landing/landing.css?url";
import { LANDING_PHOTOS } from "../landing/photos";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: landingStyles },
  { rel: "preload", as: "image", href: LANDING_PHOTOS.hero.src },
];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const locale = data?.locale ?? "en";
  const copy = COPIES[locale];
  return [
    ...pageMeta({
      title: copy.meta.title,
      description: copy.meta.description,
      path: landingPath(locale),
      locale,
      hreflang: true,
    }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "sendtally",
        url: SITE_URL,
        applicationCategory: "HealthApplication",
        operatingSystem: "Web, iOS, Android",
        description: copy.meta.description,
        image: `${SITE_URL}/og.jpg`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    },
  ];
};

type LoaderData = { signedIn: boolean; locale: Locale };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return {
    signedIn: await isSignedIn(args),
    locale: landingLocale(new URL(args.request.url).pathname) ?? "en",
  };
}

export default function Home(): React.ReactElement {
  const loaderData = useLoaderData<typeof loader>();
  const auth = useAuth();
  const signedIn = loaderData.signedIn || auth.isSignedIn === true;
  return (
    <LandingProvider signedIn={signedIn} locale={loaderData.locale}>
      <Nav />
      <Hero />
      <FreeSection />
      <PhotoBand />
      <Insights />
      <SessionBreakdown />
      <StravaSection />
      <HowItWorks />
      <Details />
      <PricePanel />
      <Footer />
    </LandingProvider>
  );
}
