import { PostCard } from "@/components/blog/post-card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { Blog } from "@/payload-types";

export function PostGrid({ posts }: { posts: Blog[] }) {
  if (posts.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No posts yet</EmptyTitle>
        <EmptyDescription>Check back soon for new content.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
