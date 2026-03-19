import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PostFormFields, StatusAndSubmit, type PostFormValues, type EventOption, type UserOption } from '../_post-form'
import { canEditPost } from '../../../../lib/post-auth'
import MediaManager from '../../../../islands/media-manager'

type Post = PostFormValues & {
  id: number
  author_email: string
  thumbnail_id: number | null
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
  author_user_id: z.string().default(''),
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
    .prepare(`SELECT id, filename, mime_type, size, created_at FROM media WHERE post_id = ? ORDER BY sort_order ASC, created_at ASC`)
    .bind(postId)
    .all<Media>()
}

type Collaborator = {
  id: number
  user_email: string
  status: string
  created_at: string
}

async function fetchCollaborators(db: D1Database, postId: number) {
  return db
    .prepare(`SELECT id, user_email, status, created_at FROM post_collaborators WHERE post_id = ? ORDER BY created_at DESC`)
    .bind(postId)
    .all<Collaborator>()
}

function isOwnerOrAdmin(user: { email: string; isAdmin: boolean }, post: Post): boolean {
  return user.isAdmin || post.author_email === user.email
}

export const POST = createRoute(
  zValidator('form', postSchema),
  async (c) => {
    const id = Number(c.req.param('id'))
    const data = c.req.valid('form')
    const db = c.env.DB

    const post = await fetchPost(db, id)
    if (!post) return c.notFound()
    if (!(await canEditPost(db, post.author_email, c.var.user.email, c.var.user.isAdmin, id)))
      return c.text('この記事を編集する権限がありません', 403)

    try {
      const eventId = data.event_id ? Number(data.event_id) : null
      const authorUserId = data.author_user_id ? Number(data.author_user_id) : null
      await db
        .prepare(
          `UPDATE posts SET
            title = ?, slug = ?, content = ?, status = ?,
            author_name = ?, author_url = ?, author_user_id = ?, github_url = ?, demo_url = ?, tags = ?, event_id = ?,
            updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(
          data.title, data.slug, data.content, data.status,
          data.author_name, data.author_url, authorUserId, data.github_url, data.demo_url, data.tags, eventId,
          id
        )
        .run()

      return c.redirect('/admin/posts')
    } catch (e: any) {
      const errorMessage = e?.message?.includes('UNIQUE') ? 'このスラッグはすでに使われています' : '保存に失敗しました'
      const [mediaResult, eventsResult, usersResult] = await Promise.all([
        fetchMedia(db, id),
        db.prepare(`SELECT id, title FROM events ORDER BY started_at DESC`).all<EventOption>(),
        db.prepare(`SELECT id, display_name, name FROM users ORDER BY name ASC`).all<UserOption>(),
      ])
      return c.render(
        <EditForm post={{ ...post, ...data }} mediaList={mediaResult.results} events={eventsResult.results} users={usersResult.results} error={errorMessage} />,
        { title: '記事を編集' }
      )
    }
  }
)

export const DELETE = createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  const post = await fetchPost(db, id)
  if (!post) return c.notFound()
  if (!isOwnerOrAdmin(c.var.user, post)) return c.text('この記事を削除する権限がありません', 403)
  await db.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run()
  return c.redirect('/admin/posts')
})

export default createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB

  const [post, mediaResult, eventsResult, usersResult] = await Promise.all([
    fetchPost(db, id),
    fetchMedia(db, id),
    db.prepare(`SELECT id, title FROM events ORDER BY started_at DESC`).all<EventOption>(),
    db.prepare(`SELECT id, display_name, name FROM users ORDER BY name ASC`).all<UserOption>(),
  ])

  if (!post) return c.notFound()
  const user = c.var.user
  const editable = await canEditPost(db, post.author_email, user.email, user.isAdmin, id)
  if (!editable) return c.text('この記事を閲覧する権限がありません', 403)

  const collabResult = isOwnerOrAdmin(user, post) ? await fetchCollaborators(db, id) : null

  return c.render(
    <EditForm post={post} mediaList={mediaResult.results} events={eventsResult.results} users={usersResult.results} collaborators={collabResult?.results} isOwner={isOwnerOrAdmin(user, post)} />,
    { title: '記事を編集' }
  )
})

function EditForm({
  post,
  mediaList,
  events,
  users,
  collaborators,
  isOwner,
  error,
}: {
  post: Post
  mediaList: Media[]
  events?: EventOption[]
  users?: UserOption[]
  collaborators?: Collaborator[]
  isOwner?: boolean
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
        <PostFormFields values={{ ...post, event_id: post.event_id != null ? String(post.event_id) : '', author_user_id: post.author_user_id != null ? String(post.author_user_id) : '' }} events={events} users={users} />
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

        {/* メディア一覧（並び替え・サムネイル選択） */}
        <MediaManager
          postId={post.id}
          initialMedia={mediaList.map((m) => ({ id: m.id, filename: m.filename, mime_type: m.mime_type, size: m.size }))}
          initialThumbnailId={post.thumbnail_id}
        />
      </section>

      {/* コラボレーター管理（作成者/adminのみ表示） */}
      {isOwner && collaborators && (
        <section class="mt-8 bg-white rounded-lg border border-gray-200">
          <div class="px-5 py-4 border-b border-gray-200">
            <h2 class="font-semibold">編集権限</h2>
            <p class="text-xs text-gray-400 mt-0.5">この記事の編集を許可するユーザーを管理できます</p>
          </div>

          {collaborators.length === 0 ? (
            <div class="px-5 py-8 text-center text-gray-400 text-sm">
              編集権限のリクエストはありません
            </div>
          ) : (
            <ul class="divide-y divide-gray-100">
              {collaborators.map((collab) => (
                <li key={collab.id} class="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span class="text-sm font-mono">{collab.user_email}</span>
                    <CollabStatusBadge status={collab.status} />
                  </div>
                  <div class="flex items-center gap-2">
                    {collab.status === 'pending' && (
                      <>
                        <form method="post" action={`/admin/posts/${post.id}/collaborators/${collab.id}`}>
                          <input type="hidden" name="action" value="approve" />
                          <button type="submit" class="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded">
                            承認
                          </button>
                        </form>
                        <form method="post" action={`/admin/posts/${post.id}/collaborators/${collab.id}`}>
                          <input type="hidden" name="action" value="reject" />
                          <button type="submit" class="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded">
                            却下
                          </button>
                        </form>
                      </>
                    )}
                    {collab.status === 'approved' && (
                      <form method="post" action={`/admin/posts/${post.id}/collaborators/${collab.id}`}>
                        <input type="hidden" name="action" value="revoke" />
                        <button type="submit" class="text-xs text-red-500 hover:text-red-700 px-2 py-1">
                          取り消し
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div class="mt-4 text-xs text-gray-400">
        <p>作成日: {post.created_at} · 更新日: {post.updated_at}</p>
      </div>
    </div>
  )
}

function CollabStatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return <span class="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">承認済み</span>
  }
  if (status === 'rejected') {
    return <span class="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">却下</span>
  }
  return <span class="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">申請中</span>
}

