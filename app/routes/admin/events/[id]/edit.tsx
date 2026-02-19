import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { EventFormFields, StatusAndSubmit, type EventFormValues } from '../_event-form'

type Event = EventFormValues & {
  id: number
  created_at: string
  updated_at: string
}

const eventSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  connpass_url: z.string().default(''),
  description: z.string().default(''),
  started_at: z.string().default(''),
  ended_at: z.string().default(''),
  place: z.string().default(''),
  address: z.string().default(''),
  limit_count: z.coerce.number().int().min(0).default(0),
  status: z.enum(['draft', 'published']),
})

async function fetchEvent(db: D1Database, id: number) {
  return db.prepare(`SELECT * FROM events WHERE id = ?`).bind(id).first<Event>()
}

export const POST = createRoute(
  zValidator('form', eventSchema),
  async (c) => {
    const id = Number(c.req.param('id'))
    const data = c.req.valid('form')
    const db = c.env.DB

    const event = await fetchEvent(db, id)
    if (!event) return c.notFound()

    try {
      await db
        .prepare(
          `UPDATE events SET
            title = ?, connpass_url = ?, description = ?,
            started_at = ?, ended_at = ?, place = ?, address = ?,
            limit_count = ?, status = ?,
            updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(
          data.title, data.connpass_url, data.description,
          data.started_at, data.ended_at, data.place, data.address,
          data.limit_count, data.status,
          id
        )
        .run()

      return c.redirect('/admin/events')
    } catch (e: any) {
      return c.render(
        <EditForm event={{ ...event, ...data }} error="保存に失敗しました" />,
        { title: 'イベントを編集' }
      )
    }
  }
)

export const DELETE = createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM events WHERE id = ?`).bind(id).run()
  return c.redirect('/admin/events')
})

export default createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  const event = await fetchEvent(c.env.DB, id)
  if (!event) return c.notFound()

  return c.render(<EditForm event={event} />, { title: 'イベントを編集' })
})

function EditForm({
  event,
  error,
}: {
  event: Event
  error?: string
}) {
  return (
    <div>
      <div class="flex items-center gap-3 mb-6">
        <a href="/admin/events" class="text-gray-400 hover:text-gray-600 text-sm">← 一覧に戻る</a>
        <h1 class="text-2xl font-bold">イベントを編集</h1>
      </div>

      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form method="post" class="space-y-5">
        <EventFormFields values={event} />
        <StatusAndSubmit
          status={event.status}
          deleteButton={
            <button
              type="button"
              class="text-red-500 hover:text-red-700 text-sm"
              onclick={`if(confirm('このイベントを削除しますか？')){fetch('/admin/events/${event.id}/edit',{method:'DELETE'}).then(()=>location.href='/admin/events')}`}
            >
              削除
            </button>
          }
        />
      </form>

      <div class="mt-4 text-xs text-gray-400">
        <p>作成日: {event.created_at} · 更新日: {event.updated_at}</p>
      </div>
    </div>
  )
}
