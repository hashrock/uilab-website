import { createRoute } from "honox/factory";
import LogoAnimation from "../islands/logo-animation";
import { isVideo } from "../lib/media";
import { getSession } from "../lib/session";

type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: string;
  tags: string;
  author_name: string;
  author_url: string;
  created_at: string;
  thumbnail_id: number | null;
  thumbnail_mime_type: string | null;
};

type Event = {
  id: number;
  title: string;
  connpass_url: string;
  description: string;
  started_at: string;
  ended_at: string;
  place: string;
};

export default createRoute(async (c) => {
  const db = c.env.DB;
  const now = new Date().toISOString().slice(0, 16);
  const session = await getSession(c);

  const [posts, upcomingEvents] = await Promise.all([
    db
      .prepare(
        `SELECT
          p.id, p.title, p.slug, p.content, p.status, p.tags, p.author_name, p.author_url, p.created_at,
          (SELECT m.id FROM media m WHERE m.post_id = p.id ORDER BY CASE WHEN m.mime_type LIKE 'video/%' THEN 0 ELSE 1 END ASC, m.created_at ASC LIMIT 1) AS thumbnail_id,
          (SELECT m.mime_type FROM media m WHERE m.post_id = p.id ORDER BY CASE WHEN m.mime_type LIKE 'video/%' THEN 0 ELSE 1 END ASC, m.created_at ASC LIMIT 1) AS thumbnail_mime_type
        FROM posts p
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC`,
      )
      .all<Post>(),
    db
      .prepare(
        `SELECT id, title, connpass_url, description, started_at, ended_at, place
         FROM events
         WHERE status = 'published' AND started_at >= ?
         ORDER BY started_at ASC
         LIMIT 3`,
      )
      .bind(now)
      .all<Event>(),
  ]);

  return c.render(
    <div class="min-h-screen bg-[#f5f0eb]">
      <title>UI Lab</title>

      {/* Hero */}
      <header class="text-center pt-20 pb-16 px-4">
        <div class="w-full max-w-6xl mx-auto h-[200px] mb-8">
          <LogoAnimation />
        </div>
        <p class="text-sm text-gray-400 max-w-xl mx-auto">
          テーマに沿ったUIを作って持ち寄る"UI大喜利"イベント
        </p>
      </header>

      {/* Upcoming Events */}
      {upcomingEvents.results.length > 0 && (
        <section class="max-w-7xl mx-auto px-4 pb-12">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <a href="/events" class="text-sm text-gray-500 hover:text-gray-900">
              すべて見る →
            </a>
          </div>
          <div class="flex flex-col gap-3">
            {upcomingEvents.results.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      <main class="max-w-7xl mx-auto px-4 pb-20">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Gallery</h2>
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

      <footer class="text-center py-8 px-4">
        {session ? (
          <a href="/admin/posts/new" class="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors">
            作品を投稿する
          </a>
        ) : (
          <a href="/auth/login" class="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors">
            ログインして投稿する
          </a>
        )}
      </footer>
    </div>,
  );
});

function EventCard({ event }: { event: Event }) {
  const start = event.started_at ? event.started_at.replace("T", " ") : "";
  return (
    <a
      href={event.connpass_url || `/events`}
      target={event.connpass_url ? "_blank" : undefined}
      rel={event.connpass_url ? "noopener noreferrer" : undefined}
      class="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow duration-200 group"
    >
      <div class="flex-shrink-0 text-center bg-[#f5f0eb] rounded-xl px-4 py-3 min-w-[56px]">
        <div class="text-xs text-gray-500 font-medium uppercase tracking-wide leading-none mb-1">
          {start.slice(5, 7)}/{start.slice(8, 10)}
        </div>
        <div class="text-lg font-bold text-gray-900 leading-none">
          {start.slice(11, 16)}
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 group-hover:underline truncate">
          {event.title}
        </p>
        {event.place && (
          <p class="text-sm text-gray-400 mt-0.5 truncate">{event.place}</p>
        )}
      </div>
      <div class="flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors">
        →
      </div>
    </a>
  );
}

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
