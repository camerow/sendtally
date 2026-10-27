import React from "react";
import { formatPublished } from "../posts";
import type { BlogPost } from "../types";

export function FeaturedPost({ post }: { post: BlogPost }): React.ReactElement {
  return (
    <a
      href={`/blog/${post.slug}`}
      className={post.hero === undefined ? "b-featured" : "b-featured b-featured--hero"}
    >
      <div className="b-featured-text">
        <div className="b-featured-meta">
          <span className="b-topic b-topic--gold">{post.topic}</span>
          <time dateTime={post.published}>{formatPublished(post.published)}</time>
          <span>{post.readMinutes} min read</span>
        </div>
        <h2 className="b-featured-title">{post.title}</h2>
        <p className="b-featured-excerpt">{post.description}</p>
        <span className="b-featured-read">Read the post →</span>
      </div>
      {post.hero !== undefined && (
        <img className="b-featured-image" src={post.hero.src} alt={post.hero.alt} loading="eager" />
      )}
    </a>
  );
}
