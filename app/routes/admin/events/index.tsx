import { createRoute } from 'honox/factory'

type Event = {
  id: number
  title: string
  connpass_url: string
  started_at: string
  status: string
  created_at: string
}

export default createRoute(async (c) => {
  const db = c.env.DB
  const events = await db
    .prepare(`SELECT id, title, connpass_url, started_at, status, created_at FROM events ORDER BY started_at DESC`)
    .all<Event>()

  return c.render(
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">イベント一覧</h1>
        <a href="/admin/events/new" class="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm">
          + 新規作成
        </a>
      </div>

      <div class="bg-white rounded-lg border border-gray-200">
        {events.results.length === 0 ? (
          <div class="px-5 py-12 text-center text-gray-400">
            <p class="mb-3">イベントがまだありません</p>
            <a href="/admin/events/new" class="text-gray-900 underline text-sm">最初のイベントを作成する</a>
          </div>
        ) : (
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-gray-500">
                <th class="px-5 py-3 font-medium">タイトル</th>
                <th class="px-5 py-3 font-medium">開催日時</th>
                <th class="px-5 py-3 font-medium">ステータス</th>
                <th class="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {events.results.map((event) => (
                <tr key={event.id} class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td class="px-5 py-3">
                    <a href={`/admin/events/${event.id}/edit`} class="font-medium hover:underline">
                      {event.title}
                    </a>
                    {event.connpass_url && (
                      <a
                        href={event.connpass_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ml-2 text-xs text-blue-500 hover:underline"
                      >
                        Connpass ↗
                      </a>
                    )}
                  </td>
                  <td class="px-5 py-3 text-gray-400">{event.started_at ? event.started_at.slice(0, 16).replace('T', ' ') : '-'}</td>
                  <td class="px-5 py-3">
                    <StatusBadge status={event.status} />
                  </td>
                  <td class="px-5 py-3">
                    <a href={`/admin/events/${event.id}/edit`} class="text-gray-500 hover:text-gray-900">
                      編集
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>,
    { title: 'イベント一覧' }
  )
})

function StatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">公開</span>
  }
  return <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">下書き</span>
}
