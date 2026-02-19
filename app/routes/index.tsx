import { createRoute } from "honox/factory";

type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: string;
  tags: string;
  created_at: string;
  thumbnail_id: number | null;
};

export default createRoute(async (c) => {
  const db = c.env.DB;
  const posts = await db
    .prepare(
      `SELECT
        p.id, p.title, p.slug, p.content, p.status, p.tags, p.created_at,
        (SELECT m.id FROM media m WHERE m.post_id = p.id ORDER BY m.created_at ASC LIMIT 1) AS thumbnail_id
      FROM posts p
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC`
    )
    .all<Post>();

  return c.render(
    <div class="min-h-screen bg-[#f5f0eb]">
      <title>UI Lab</title>

      {/* Hero */}
      <header class="text-center pt-20 pb-16 px-4">
        <h1 class="text-5xl font-bold leading-tight tracking-tight text-gray-900 max-w-xl mx-auto">
          A collection of UI details worth noticing
        </h1>
      </header>

      {/* Gallery */}
      <main class="max-w-5xl mx-auto px-4 pb-20">
        {posts.results.length === 0 ? (
          <p class="text-center text-gray-400 py-20">No posts yet.</p>
        ) : (
          <div class="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {posts.results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>,
  );
});

function PostCard({ post }: { post: Post }) {
  const tags = post.tags
    ? post.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <a
      href={`/posts/${post.slug}`}
      class="block break-inside-avoid mb-4 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 group"
    >
      {post.thumbnail_id && (
        <div class="overflow-hidden">
          <img
            src={`/media/${post.thumbnail_id}`}
            alt={post.title}
            class="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      <div class="p-5">
        <h2 class="font-semibold text-gray-900 text-base leading-snug mb-2">
          {post.title}
        </h2>
        {post.content && (
          <p class="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">
            {post.content}
          </p>
        )}
        {tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
