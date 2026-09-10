"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "@/design-system/icons";
import { Button, Field, Input, Heading, Text, RuleGrid } from "@/design-system";
import { BlogPostCard } from "./BlogPostCard";
import type { BlogPost } from "./posts";

export function BlogExplorer({
  posts,
  categories,
}: {
  posts: BlogPost[];
  categories: readonly string[];
}) {
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const featuredPost = useMemo(() => posts.find((p) => p.featured), [posts]);
  const showFeatured = featuredPost && category === "All" && !search;

  // The featured post gets its own lead card above, so it's excluded from
  // the grid below when shown there -- otherwise it appeared twice.
  const filtered = posts.filter((post) => {
    if (showFeatured && post.id === featuredPost.id) return false;
    const matchesCategory = category === "All" || post.category === category;
    const q = search.toLowerCase();
    const matchesSearch =
      !q || post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <div className="mb-12 flex flex-col gap-6">
        <Field label="Search articles" labelHidden>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mak-subtle"
              size={18}
            />
            <Input
              type="search"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>
        </Field>

        <div className="flex flex-wrap justify-center gap-2.5">
          {categories.map((c) => (
            <Button
              key={c}
              type="button"
              variant={category === c ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {showFeatured ? (
        <div className="mb-14">
          <BlogPostCard post={featuredPost} featured />
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <RuleGrid cols={{ base: 1, md: 2, lg: 3 }}>
          {filtered.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </RuleGrid>
      ) : (
        <div className="border-2 border-mak-line py-20 text-center">
          <Heading level="heading" as="h3" className="mb-3">
            No articles found
          </Heading>
          <Text tone="muted" className="mb-6">
            {search
              ? `No articles match "${search}".`
              : `No articles found in the ${category} category.`}
          </Text>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSearch("");
              setCategory("All");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </>
  );
}
