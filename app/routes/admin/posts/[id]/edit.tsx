import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PostFormFields, StatusAndSubmit, type PostFormValues, type EventOption } from '../_post-form'

type Post = PostFormValues & {
  id: number
  created_at: string
  updated_at: string
}

type Media = {
  id: number
  filename: string
  mime_type: string
  size: number
  created_at: string
}

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
  event_id: z.string().default(''),
})

async function fetchPost(db: D1Database, id: number) {
  return db.prepare(`SELECT * FROM posts WHERE id = ?`).bind(id).first<Post>()
}

async function fetchMedia(db: D1Database, postId: number) {
  return db
    .prepare(`SELECT id, filename, mime_type, size, created_at FROM media WHERE post_id = ? ORDER BY created_at DESC`)
    .bind(postId)
    .all<Media>()
}

export const POST = createRoute(
  zValidator('form', postSchema),
  async (c) => {
    const id = Number(c.req.param('id'))
    const data = c.req.valid('form')
    const db = c.env.DB

    const post = await fetchPost(db, id)
    if (!post) return c.notFound()

    try {
      const eventId = data.event_id ? Number(data.event_id) : null
      await db
        .prepare(
          `UPDATE posts SET
            title = ?, slug = ?, content = ?, status = ?,
            author_name = ?, author_url = ?, github_url = ?, demo_url = ?, tags = ?, event_id = ?,
            updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(
          data.title, data.slug, data.content, data.status,
          data.author_name, data.author_url, data.github_url, data.demo_url, data.tags, eventId,
          id
        )
        .run()

      return c.redirect('/admin/posts')
    } catch (e: any) {
      const errorMessage = e?.message?.includes('UNIQUE') ? 'このスラッグはすでに使われています' : '保存に失敗しました'
      const [mediaResult, eventsResult] = await Promise.all([
        fetchMedia(db, id),
        db.prepare(`SELECT id, title FROM events ORDER BY started_at DESC`).all<EventOption>(),
      ])
      return c.render(
        <EditForm post={{ ...post, ...data }} mediaList={mediaResult.results} events={eventsResult.results} error={errorMessage} />,
        { title: '記事を編集' }
      )
    }
  }
)

export const DELETE = createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run()
  return c.redirect('/admin/posts')
})

export default createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB

  const [post, mediaResult, eventsResult] = await Promise.all([
    fetchPost(db, id),
    fetchMedia(db, id),
    db.prepare(`SELECT id, title FROM events ORDER BY started_at DESC`).all<EventOption>(),
  ])

  if (!post) return c.notFound()

  return c.render(
    <EditForm post={post} mediaList={mediaResult.results} events={eventsResult.results} />,
    { title: '記事を編集' }
  )
})

function EditForm({
  post,
  mediaList,
  events,
  error,
}: {
  post: Post
  mediaList: Media[]
  events?: EventOption[]
  error?: string
}) {
  return (
    <div>
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <a href="/admin/posts" class="text-gray-400 hover:text-gray-600 text-sm">← 一覧に戻る</a>
          <h1 class="text-2xl font-bold">記事を編集</h1>
        </div>
        {post.status === 'published' && post.slug && (
          <a
            href={`/posts/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-gray-400 hover:text-gray-700"
          >
            公開ページを見る →
          </a>
        )}
      </div>

      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form method="post" class="space-y-5">
        <PostFormFields values={{ ...post, event_id: post.event_id ?? '' }} events={events} />
        <StatusAndSubmit
          status={post.status}
          deleteButton={
            <button
              type="button"
              class="text-red-500 hover:text-red-700 text-sm"
              onclick={`if(confirm('この記事を削除しますか？')){fetch('/admin/posts/${post.id}/edit',{method:'DELETE'}).then(()=>location.href='/admin/posts')}`}
            >
              削除
            </button>
          }
        />
      </form>

      {/* メディア */}
      <section class="mt-8 bg-white rounded-lg border border-gray-200">
        <div class="px-5 py-4 border-b border-gray-200">
          <h2 class="font-semibold">メディア</h2>
          <p class="text-xs text-gray-400 mt-0.5">画像・動画をアップロードして記事に添付できます（最大100MB）</p>
        </div>

        {/* アップロードフォーム */}
        <div class="px-5 py-4 border-b border-gray-200">
          <form
            method="post"
            action={`/admin/posts/${post.id}/media`}
            enctype="multipart/form-data"
            class="flex items-center gap-3"
          >
            <input
              type="file"
              name="file"
              accept="image/*,video/*"
              required
              class="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <button
              type="submit"
              class="bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 text-sm whitespace-nowrap"
            >
              アップロード
            </button>
          </form>
        </div>

        {/* メディア一覧 */}
        {mediaList.length === 0 ? (
          <div class="px-5 py-8 text-center text-gray-400 text-sm">
            アップロードされたメディアはありません
          </div>
        ) : (
          <ul class="divide-y divide-gray-100">
            {mediaList.map((m) => (
              <li key={m.id} class="px-5 py-3 flex items-center gap-4">
                {/* サムネイル or アイコン */}
                <div class="w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  {m.mime_type.startsWith('image/') ? (
                    <img
                      src={`/media/${m.id}`}
                      alt={m.filename}
                      class="w-full h-full object-cover"
                    />
                  ) : (
                    <span class="text-2xl">🎬</span>
                  )}
                </div>

                {/* ファイル情報 */}
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{m.filename}</p>
                  <p class="text-xs text-gray-400">{m.mime_type} · {formatSize(m.size)}</p>
                  <p class="text-xs text-gray-300 mt-0.5 font-mono">/media/{m.id}</p>
                </div>

                {/* アクション */}
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                    onclick={`navigator.clipboard.writeText('/media/${m.id}').then(()=>this.textContent='コピー済み！').catch(()=>{})`}
                  >
                    URLをコピー
                  </button>
                  <form
                    method="post"
                    action={`/admin/posts/${post.id}/media/${m.id}/delete`}
                    onsubmit="return confirm('このメディアを削除しますか？')"
                  >
                    <button
                      type="submit"
                      class="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      削除
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div class="mt-4 text-xs text-gray-400">
        <p>作成日: {post.created_at} · 更新日: {post.updated_at}</p>
      </div>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
