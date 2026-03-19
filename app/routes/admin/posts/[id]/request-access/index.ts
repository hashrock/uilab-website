import { createRoute } from 'honox/factory'

// 編集権限をリクエスト
export const POST = createRoute(async (c) => {
  const postId = Number(c.req.param('id'))
  if (isNaN(postId)) return c.notFound()

  const db = c.env.DB
  const user = c.var.user

  // 記事の存在確認
  const post = await db.prepare(`SELECT author_email FROM posts WHERE id = ?`).bind(postId).first<{ author_email: string }>()
  if (!post) return c.notFound()

  // 自分の記事にはリクエスト不要
  if (post.author_email === user.email || user.isAdmin) {
    return c.redirect('/admin/posts')
  }

  // upsert（既に却下済みの場合はpendingに戻す）
  await db
    .prepare(
      `INSERT INTO post_collaborators (post_id, user_email, status) VALUES (?, ?, 'pending')
       ON CONFLICT(post_id, user_email) DO UPDATE SET status = 'pending', updated_at = datetime('now')
       WHERE status = 'rejected'`
    )
    .bind(postId, user.email)
    .run()

  return c.redirect('/admin/posts')
})
