import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PostFormFields, StatusAndSubmit, type PostFormValues } from './_post-form'

const postSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  slug: z.string().min(1, 'スラッグは必須です').regex(/^[a-z0-9-]+$/, 'スラッグは英小文字・数字・ハイフンのみ使えます'),
  content: z.string().default(''),
  status: z.enum(['draft', 'published']),
  author_name: z.string().default(''),
  author_url: z.string().default(''),
  github_url: z.string().default(''),
  demo_url: z.string().default(''),
  tags: z.string().default(''),
})

export const POST = createRoute(
  zValidator('form', postSchema),
  async (c) => {
    const data = c.req.valid('form')
    const db = c.env.DB

    try {
      await db
        .prepare(
          `INSERT INTO posts (title, slug, content, status, author_name, author_url, github_url, demo_url, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          data.title, data.slug, data.content, data.status,
          data.author_name, data.author_url, data.github_url, data.demo_url, data.tags
        )
        .run()

      return c.redirect('/admin/posts')
    } catch (e: any) {
      const errorMessage = e?.message?.includes('UNIQUE') ? 'このスラッグはすでに使われています' : '保存に失敗しました'
      return c.render(
        <NewForm error={errorMessage} defaultValues={data} />,
        { title: '新規記事' }
      )
    }
  }
)

export default createRoute((c) => {
  return c.render(<NewForm />, { title: '新規記事' })
})

function NewForm({
  error,
  defaultValues,
}: {
  error?: string
  defaultValues?: Partial<PostFormValues>
}) {
  return (
    <div>
      <div class="flex items-center gap-3 mb-6">
        <a href="/admin/posts" class="text-gray-400 hover:text-gray-600 text-sm">← 一覧に戻る</a>
        <h1 class="text-2xl font-bold">新規記事</h1>
      </div>

      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form method="post" class="space-y-5">
        <PostFormFields values={defaultValues} />
        <StatusAndSubmit status={defaultValues?.status} />
      </form>
    </div>
  )
}
