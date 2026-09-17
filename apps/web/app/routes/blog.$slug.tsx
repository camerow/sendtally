import React from "react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import blogStyles from "../blog/blog.css?url";
import { PostRow } from "../blog/components/PostRow";
import { findPost, formatPublished, POSTS } from "../blog/posts";
import { AccountCta } from "../landing/components/AccountCta";
import { Footer } from "../landing/components/Footer";
import { Nav } from "../landing/components/Nav";
import landingStyles from "../landing/landing.css?url";
import { pageMeta, SITE_URL } from "../lib/seo";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: landingStyles },
  { rel: "stylesheet", href: blogStyles },
];

export function loader({ params }: LoaderFunctionArgs): { slug: string } {
  const post = findPost(params.slug);
  if (post === undefined) throw new Response("Not found", { status: 404 });
  return { slug: post.slug };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const post = findPost(data?.slug);
  if (post === undefined) return [{ title: "Post not found - sendtally" }];
  const path = `/blog/${post.slug}`;
  return [
    ...pageMeta({ title: `${post.title} - sendtally`, description: post.description, path }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.published,
        url: `${SITE_URL}${path}`,
        image: `${SITE_URL}/og.jpg`,
        author: { "@type": "Organization", name: "sendtally", url: SITE_URL },
        publisher: { "@type": "Organization", name: "sendtally", url: SITE_URL },
      },
    },
  ];
};

export default function BlogPost(): React.ReactElement {
  const { slug } = useLoaderData<typeof loader>();
  const post = findPost(slug);
  if (post === undefined) throw new Response("Not found", { status: 404 });
  const others = POSTS.filter((p) => p.slug !== slug);
  return (
    <div>
      <Nav sections={false} />
      <main className="b-page">
        <article className="b-article">
          <a href="/blog" className="b-back">
            ← All posts
          </a>
          <div className="b-article-meta">
            <span className="b-topic">{post.topic}</span>
            <time dateTime={post.published}>{formatPublished(post.published)}</time>
            <span>{post.readMinutes} min read</span>
          </div>
          <h1 className="b-article-title">{post.title}</h1>
          <p className="b-article-lede">{post.description}</p>
          <div className="b-prose">
            <post.Body />
          </div>
        </article>
        <aside className="b-cta">
          <div>
            <h2 className="b-cta-title">See your own number</h2>
            <p className="b-cta-copy">
              Log a session and sendtally scores it against your own history. Free to use.
            </p>
          </div>
          <AccountCta label="Create account" />
        </aside>
        {others.length > 0 && (
          <section className="b-list" aria-labelledby="b-more">
            <h2 id="b-more" className="b-list-heading">
              More from the blog
            </h2>
            {others.map((p) => (
              <PostRow key={p.slug} post={p} />
            ))}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
