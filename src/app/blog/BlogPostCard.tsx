import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
import { Badge, Heading, Text } from "@/design-system";
import { ArrowRightIcon } from "@/design-system/icons";
import { cn } from "@/lib/utils";
import type { BlogPost } from "./posts";

/** One post: the small grid card, or (via `featured`) the large lead card. */
export function BlogPostCard({
  post,
  featured = false,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  return (
    <article
      className={cn(
        "group border-2 border-mak-line",
        featured && "grid gap-0 lg:grid-cols-2"
      )}
    >
      <div className={cn("relative aspect-[16/10]", featured && "lg:aspect-auto")}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
          className="object-cover transition-transform duration-500 ease-mak group-hover:scale-105"
        />
      </div>

      <div className={cn("flex flex-col p-6", featured ? "lg:p-10 lg:justify-center" : "")}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Badge tone="accent">{post.category}</Badge>
          <Text size="micro" tone="subtle" as="span" className="flex items-center gap-1 normal-case tracking-normal">
            <Calendar aria-hidden="true" className="size-3.5" />
            {post.date}
          </Text>
          <Text size="micro" tone="subtle" as="span" className="flex items-center gap-1 normal-case tracking-normal">
            <Clock aria-hidden="true" className="size-3.5" />
            {post.readTime}
          </Text>
        </div>

        <Heading level={featured ? "title" : "subheading"} as="h3" className="mb-2.5">
          {post.title}
        </Heading>
        <Text size="small" tone="muted" className="mb-5 line-clamp-3">
          {post.excerpt}
        </Text>

        <span className="mt-auto inline-flex items-center gap-1.5 font-display text-mak-small font-extrabold text-mak-accent">
          Read more
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-200 ease-mak group-hover:translate-x-1"
          />
        </span>
      </div>
    </article>
  );
}
