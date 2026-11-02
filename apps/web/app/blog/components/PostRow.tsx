import React from "react";
import { formatPublished } from "../posts";
import type { BlogPost } from "../types";

export function PostRow({ post }: { post: BlogPost }): React.ReactElement {
  return (
    <a href={`/blog/${post.slug}`} className="b-row">
      <time className="b-row-date" dateTime={post.published}>
        {formatPublished(post.published)}
      </time>
      <div className="b-row-body">
        <h3 className="b-row-title">{post.title}</h3>
        <p className="b-row-excerpt">{post.description}</p>
      </div>
      <span className="b-topic">{post.topic}</span>
    </a>
  );
}
