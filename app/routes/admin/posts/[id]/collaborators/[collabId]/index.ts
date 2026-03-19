import { createRoute } from 'honox/factory'

// 承認・却下・取り消し（作成者/adminのみ）
export const POST = createRoute(async (c) => {
  const postId = Number(c.req.param('id'))
  const collabId = Number(c.req.param('collabId'))
  if (isNaN(postId) || isNaN(collabId)) return c.notFound()

  const db = c.env.DB
  const user = c.var.user

  // 記事の作成者またはadminか確認
  const post = await db.prepare(`SELECT author_email FROM posts WHERE id = ?`).bind(postId).first<{ author_email: string }>()
  if (!post) return c.notFound()
  if (!user.isAdmin && post.author_email !== user.email) {
    return c.text('権限がありません', 403)
  }

  const body = await c.req.parseBody()
  const action = body['action']

  if (action === 'approve') {
    await db
      .prepare(`UPDATE post_collaborators SET status = 'approved', updated_at = datetime('now') WHERE id = ? AND post_id = ?`)
      .bind(collabId, postId)
      .run()
  } else if (action === 'reject') {
    await db
      .prepare(`UPDATE post_collaborators SET status = 'rejected', updated_at = datetime('now') WHERE id = ? AND post_id = ?`)
      .bind(collabId, postId)
      .run()
  } else if (action === 'revoke') {
    await db
      .prepare(`DELETE FROM post_collaborators WHERE id = ? AND post_id = ?`)
      .bind(collabId, postId)
      .run()
  }

  return c.redirect(`/admin/posts/${postId}/edit`)
})
