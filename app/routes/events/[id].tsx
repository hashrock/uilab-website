import { createRoute } from "honox/factory";
import { isVideo } from "../../lib/media";

type Event = {
  id: number;
  title: string;
  connpass_url: string;
  description: string;
  started_at: string;
  ended_at: string;
  place: string;
  address: string;
};

type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  author_name: string;
  author_url: string;
  tags: string;
  created_at: string;
  thumbnail_id: number | null;
  thumbnail_mime_type: string | null;
};

export default createRoute(async (c) => {
  const id = Number(c.req.param("id"));
  const db = c.env.DB;

  const event = await db
    .prepare(
      `SELECT id, title, connpass_url, description, started_at, ended_at, place, address
       FROM events WHERE id = ? AND status = 'published'`
    )
    .bind(id)
    .first<Event>();

  if (!event) return c.notFound();

  const posts = await db
    .prepare(
      `SELECT
        p.id, p.title, p.slug, p.content, p.tags, p.author_name, p.author_url, p.created_at,
        (SELECT m.id FROM media m WHERE m.post_id = p.id ORDER BY CASE WHEN m.mime_type LIKE 'video/%' THEN 0 ELSE 1 END ASC, m.created_at ASC LIMIT 1) AS thumbnail_id,
        (SELECT m.mime_type FROM media m WHERE m.post_id = p.id ORDER BY CASE WHEN m.mime_type LIKE 'video/%' THEN 0 ELSE 1 END ASC, m.created_at ASC LIMIT 1) AS thumbnail_mime_type
      FROM posts p
      WHERE p.event_id = ? AND p.status = 'published'
      ORDER BY p.created_at DESC`
    )
    .bind(id)
    .all<Post>();

  const start = event.started_at ? event.started_at.replace("T", " ") : "";
  const end = event.ended_at ? event.ended_at.replace("T", " ") : "";

  return c.render(
    <div class="min-h-screen bg-[#f5f0eb]">
      <title>{event.title} — UI Lab</title>

      <header class="max-w-4xl mx-auto px-4 pt-16 pb-10">
        <a href="/events" class="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">
          ← Events
        </a>
        <h1 class="text-4xl font-bold text-gray-900">{event.title}</h1>

        <div class="mt-3 space-y-1 text-sm text-gray-500">
          {start && end && (
            <p>
              {start} 〜 {end.slice(11, 16)}
            </p>
          )}
          {event.place && <p>{event.place}</p>}
        </div>

        {event.description && (
          <p class="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        )}

        {event.connpass_url && (
          <a
            href={event.connpass_url}
            target="_blank"
            rel="noopener noreferrer"
            class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Connpass で詳細を見る →
          </a>
        )}
      </header>

      <main class="max-w-7xl mx-auto px-4 pb-20">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          作品一覧
          {posts.results.length > 0 && (
            <span class="text-sm font-normal text-gray-400 ml-2">{posts.results.length}件</span>
          )}
        </h2>
        {posts.results.length === 0 ? (
          <p class="text-center text-gray-400 py-12">まだ作品がありません</p>
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
        <div class="overflow-hidden aspect-[4/3]">
          {post.thumbnail_mime_type && isVideo(post.thumbnail_mime_type) ? (
            <video
              src={`/media/${post.thumbnail_id}`}
              class="w-full h-full object-cover"
              autoplay
              muted
              loop
              playsinline
            />
          ) : (
            <img
              src={`/media/${post.thumbnail_id}`}
              alt={post.title}
              class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          )}
        </div>
      )}
      <div class="p-5">
        <h2 class="font-semibold text-gray-900 text-base leading-snug mb-1">
          {post.title}
        </h2>
        {post.author_name && (
          <p class="text-xs text-gray-400 mb-2">{post.author_name}</p>
        )}
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
