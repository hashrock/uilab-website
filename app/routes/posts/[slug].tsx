import { createRoute } from "honox/factory";
import { isVideo } from "../../lib/media";

type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  tags: string;
  author_name: string;
  author_url: string;
  github_url: string;
  demo_url: string;
  created_at: string;
};

type Media = {
  id: number;
  filename: string;
  mime_type: string;
};

export default createRoute(async (c) => {
  const slug = c.req.param("slug");
  const db = c.env.DB;

  const post = await db
    .prepare(
      `SELECT id, title, slug, content, tags, author_name, author_url, github_url, demo_url, created_at
       FROM posts WHERE slug = ? AND status = 'published'`
    )
    .bind(slug)
    .first<Post>();

  if (!post) return c.notFound();

  const media = await db
    .prepare(`SELECT id, filename, mime_type FROM media WHERE post_id = ? ORDER BY created_at ASC`)
    .bind(post.id)
    .all<Media>();

  const tags = post.tags
    ? post.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return c.render(
    <div class="min-h-screen bg-[#f5f0eb]">
      <title>{post.title} — UI Lab</title>
      <div class="max-w-2xl mx-auto px-4 py-16">
        <a href="/" class="text-sm text-gray-400 hover:text-gray-700 mb-8 inline-block">
          ← Back
        </a>
        <h1 class="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
        {tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mb-6">
            {tags.map((tag) => (
              <span key={tag} class="text-xs bg-white text-gray-500 px-2.5 py-1 rounded-full border border-gray-200">
                {tag}
              </span>
            ))}
          </div>
        )}
        {media.results.length > 0 && (
          <div class="space-y-3 mb-6">
            {media.results.map((m) =>
              isVideo(m.mime_type) ? (
                <video
                  key={m.id}
                  src={`/media/${m.id}`}
                  class="w-full rounded-xl"
                  controls
                  muted
                  loop
                  playsinline
                />
              ) : (
                <img
                  key={m.id}
                  src={`/media/${m.id}`}
                  alt={m.filename}
                  class="w-full rounded-xl"
                />
              )
            )}
          </div>
        )}
        {post.content && (
          <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        {(post.demo_url || post.github_url) && (
          <div class="flex gap-3 mt-8">
            {post.demo_url && (
              <a href={post.demo_url} target="_blank" rel="noopener noreferrer"
                class="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700">
                Demo
              </a>
            )}
            {post.github_url && (
              <a href={post.github_url} target="_blank" rel="noopener noreferrer"
                class="bg-white text-gray-700 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                GitHub
              </a>
            )}
          </div>
        )}
      </div>
    </div>,
  );
});
