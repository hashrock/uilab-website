import { createRoute } from "honox/factory";

type Event = {
  id: number;
  title: string;
  connpass_url: string;
  description: string;
  started_at: string;
  ended_at: string;
  place: string;
  address: string;
  limit_count: number;
};

export default createRoute(async (c) => {
  const db = c.env.DB;
  const now = new Date().toISOString().slice(0, 16);

  const [upcoming, past] = await Promise.all([
    db
      .prepare(
        `SELECT id, title, connpass_url, description, started_at, ended_at, place, address, limit_count
         FROM events
         WHERE status = 'published' AND started_at >= ?
         ORDER BY started_at ASC`,
      )
      .bind(now)
      .all<Event>(),
    db
      .prepare(
        `SELECT id, title, connpass_url, description, started_at, ended_at, place, address, limit_count
         FROM events
         WHERE status = 'published' AND started_at < ?
         ORDER BY started_at DESC`,
      )
      .bind(now)
      .all<Event>(),
  ]);

  return c.render(
    <div class="min-h-screen bg-[#f5f0eb]">
      <title>Events — UI Lab</title>

      <header class="max-w-4xl mx-auto px-4 pt-16 pb-10">
        <a href="/" class="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">
          ← UI Lab
        </a>
        <h1 class="text-4xl font-bold text-gray-900">Events</h1>
        <p class="text-gray-500 mt-2">UI Labのイベント一覧</p>
      </header>

      <main class="max-w-4xl mx-auto px-4 pb-20 space-y-12">
        {/* Upcoming */}
        <section>
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Upcoming
          </h2>
          {upcoming.results.length === 0 ? (
            <p class="text-gray-400 text-sm py-6">開催予定のイベントはありません</p>
          ) : (
            <div class="flex flex-col gap-4">
              {upcoming.results.map((event) => (
                <EventDetail key={event.id} event={event} isPast={false} />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        {past.results.length > 0 && (
          <section>
            <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Past
            </h2>
            <div class="flex flex-col gap-4">
              {past.results.map((event) => (
                <EventDetail key={event.id} event={event} isPast={true} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>,
  );
});

function EventDetail({ event, isPast }: { event: Event; isPast: boolean }) {
  const start = event.started_at ? event.started_at.replace("T", " ") : "";
  const end = event.ended_at ? event.ended_at.replace("T", " ") : "";

  return (
    <div class={`bg-white rounded-2xl overflow-hidden shadow-sm ${isPast ? "opacity-60" : ""}`}>
      <div class="p-6">
        <div class="flex items-start gap-4">
          {/* Date badge */}
          <div class="flex-shrink-0 text-center bg-[#f5f0eb] rounded-xl px-4 py-3 min-w-[64px]">
            <div class="text-xs text-gray-500 font-medium uppercase tracking-wide leading-none mb-1">
              {start.slice(0, 4)}
            </div>
            <div class="text-xl font-bold text-gray-900 leading-none">
              {start.slice(5, 7)}/{start.slice(8, 10)}
            </div>
            <div class="text-sm text-gray-500 mt-1 leading-none">
              {start.slice(11, 16)}
            </div>
          </div>

          {/* Info */}
          <div class="flex-1 min-w-0">
            <a href={`/events/${event.id}`} class="text-xl font-bold text-gray-900 hover:underline">
              {event.title}
            </a>

            <div class="mt-2 space-y-1 text-sm text-gray-500">
              {start && end && (
                <p>
                  {start} 〜 {end.slice(11, 16)}
                </p>
              )}
              {event.place && <p>📍 {event.place}</p>}
            </div>

            {event.description && (
              <p class="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-line">
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
                Connpass で申し込む →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
