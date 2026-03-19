import { createRoute } from 'honox/factory'
import { canEditPost } from '../../../../../lib/post-auth'

// メディア並び替え + サムネイル設定
export const POST = createRoute(async (c) => {
  const postId = Number(c.req.param('id'))
  if (isNaN(postId)) return c.notFound()

  const db = c.env.DB
  const user = c.var.user

  const post = await db.prepare(`SELECT author_email FROM posts WHERE id = ?`).bind(postId).first<{ author_email: string }>()
  if (!post) return c.notFound()
  if (!(await canEditPost(db, post.author_email, user.email, user.isAdmin, postId))) {
    return c.json({ error: '権限がありません' }, 403)
  }

  const body = await c.req.json<{ order: number[]; thumbnail_id: number | null }>()

  // 並び順を更新
  const stmts = body.order.map((mediaId, i) =>
    db.prepare(`UPDATE media SET sort_order = ? WHERE id = ? AND post_id = ?`).bind(i, mediaId, postId)
  )

  // サムネイルを更新
  stmts.push(
    db.prepare(`UPDATE posts SET thumbnail_id = ?, updated_at = datetime('now') WHERE id = ?`).bind(body.thumbnail_id, postId)
  )

  await db.batch(stmts)

  return c.json({ ok: true })
})
