import { BlogEmpty } from "@/components/marketing/blog/blog-empty";
import { PostCard } from "@/components/marketing/blog/post-card";
import type { Post } from "@/payload-types";

export function PostGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return <BlogEmpty className="py-12" />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
