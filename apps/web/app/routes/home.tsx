import { useAuth } from "@clerk/react-router";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { isSignedIn } from "../auth/session.server";
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
import { COPY } from "../landing/copy";
import { LandingProvider } from "../landing/LandingContext";
import landingStyles from "../landing/landing.css?url";
import { LANDING_PHOTOS } from "../landing/photos";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: landingStyles },
  { rel: "preload", as: "image", href: LANDING_PHOTOS.hero.src },
];

export function meta(): Array<Record<string, string>> {
  return [{ title: COPY.meta.title }, { name: "description", content: COPY.meta.description }];
}

type LoaderData = { signedIn: boolean };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return { signedIn: await isSignedIn(args) };
}

export default function Home(): React.ReactElement {
  const loaderData = useLoaderData<typeof loader>();
  const auth = useAuth();
  const signedIn = loaderData.signedIn || auth.isSignedIn === true;
  return (
    <LandingProvider signedIn={signedIn}>
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
