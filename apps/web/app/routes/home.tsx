import { useAuth } from "@clerk/react-router";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import type { Locale } from "@sendtally/features/i18n";
import { isSignedIn } from "../auth/session.server";
import { landingLocale } from "../lib/locale";
import { landingPath, pageMeta, SITE_URL } from "../lib/seo";
import { Extras } from "../landing/components/Extras";
import { FeatureSection } from "../landing/components/FeatureSection";
import { Footer } from "../landing/components/Footer";
import { Hero } from "../landing/components/Hero";
import { MadeBy } from "../landing/components/MadeBy";
import { Nav } from "../landing/components/Nav";
import { StartSection } from "../landing/components/StartSection";
import { TabsStrip } from "../landing/components/TabsStrip";
import { COPIES } from "../landing/copies";
import { LandingProvider } from "../landing/LandingContext";
import { storePlatform, type StorePlatform } from "../lib/stores";
import landingStyles from "../landing/landing.css?url";
import { PHOTOS } from "../landing/media";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: landingStyles },
  { rel: "preload", as: "image", href: PHOTOS.sandstoneWall },
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

type LoaderData = { signedIn: boolean; locale: Locale; platform: StorePlatform };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return {
    signedIn: await isSignedIn(args),
    locale: landingLocale(new URL(args.request.url).pathname) ?? "en",
    platform: storePlatform(args.request.headers.get("user-agent")),
  };
}

export default function Home(): React.ReactElement {
  const loaderData = useLoaderData<typeof loader>();
  const auth = useAuth();
  const signedIn = loaderData.signedIn || auth.isSignedIn === true;
  return (
    <LandingProvider signedIn={signedIn} locale={loaderData.locale} platform={loaderData.platform}>
      <Nav />
      <Hero />
      <TabsStrip />
      <main>
        {COPIES[loaderData.locale].features.map((feature, i) => (
          <FeatureSection key={feature.id} feature={feature} flip={i % 2 === 1} />
        ))}
        <Extras />
        <MadeBy />
        <StartSection />
      </main>
      <Footer stores={false} />
    </LandingProvider>
  );
}
