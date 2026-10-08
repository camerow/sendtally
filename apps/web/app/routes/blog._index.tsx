import React from "react";
import type { LinksFunction } from "react-router";
import blogStyles from "../blog/blog.css?url";
import { FeaturedPost } from "../blog/components/FeaturedPost";
import { PostRow } from "../blog/components/PostRow";
import { POSTS } from "../blog/posts";
import { Footer } from "../landing/components/Footer";
import { Nav } from "../landing/components/Nav";
import landingStyles from "../landing/landing.css?url";
import { pageMeta } from "../lib/seo";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: landingStyles },
  { rel: "stylesheet", href: blogStyles },
];

export function meta(): Array<Record<string, string>> {
  return pageMeta({
    title: "Blog - sendtally",
    description:
      "How sendtally scores climbing effort, reads grades across routes and boulders, and what is shipping next.",
    path: "/blog",
  });
}

export default function BlogIndex(): React.ReactElement {
  const [latest, ...rest] = POSTS;
  return (
    <div>
      <Nav sections={false} />
      <main className="b-page">
        <header className="b-header">
          <span className="b-eyebrow">The sendtally blog</span>
          <h1 className="b-header-title">Notes on climbing effort</h1>
          <p className="b-header-lede">
            How sessions get scored, how grades are read, and what is changing in the app. Written
            by the person who builds it.
          </p>
        </header>
        {latest !== undefined && <FeaturedPost post={latest} />}
        {rest.length > 0 && (
          <section className="b-list" aria-labelledby="b-earlier">
            <h2 id="b-earlier" className="b-list-heading">
              Earlier posts
            </h2>
            {rest.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
