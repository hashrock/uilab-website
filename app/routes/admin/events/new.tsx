import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { EventFormFields, StatusAndSubmit, type EventFormValues } from './_event-form'

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

export const POST = createRoute(
  zValidator('form', eventSchema),
  async (c) => {
    const data = c.req.valid('form')
    const db = c.env.DB

    try {
      await db
        .prepare(
          `INSERT INTO events (title, connpass_url, description, started_at, ended_at, place, address, limit_count, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          data.title, data.connpass_url, data.description,
          data.started_at, data.ended_at, data.place, data.address,
          data.limit_count, data.status
        )
        .run()

      return c.redirect('/admin/events')
    } catch (e: any) {
      return c.render(
        <NewForm error="保存に失敗しました" defaultValues={data} />,
        { title: '新規イベント' }
      )
    }
  }
)

export default createRoute((c) => {
  return c.render(<NewForm />, { title: '新規イベント' })
})

function NewForm({
  error,
  defaultValues,
}: {
  error?: string
  defaultValues?: Partial<EventFormValues>
}) {
  return (
    <div>
      <div class="flex items-center gap-3 mb-6">
        <a href="/admin/events" class="text-gray-400 hover:text-gray-600 text-sm">← 一覧に戻る</a>
        <h1 class="text-2xl font-bold">新規イベント</h1>
      </div>

      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form method="post" class="space-y-5">
        <EventFormFields values={defaultValues} />
        <StatusAndSubmit status={defaultValues?.status} />
      </form>
    </div>
  )
}
