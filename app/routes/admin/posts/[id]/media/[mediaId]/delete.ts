import { createRoute } from 'honox/factory'

type Media = {
  r2_key: string
  post_id: number
}

export const POST = createRoute(async (c) => {
  const postId = Number(c.req.param('id'))
  const mediaId = Number(c.req.param('mediaId'))
  if (isNaN(postId) || isNaN(mediaId)) return c.notFound()

  // 作成者チェック
  const post = await c.env.DB.prepare(`SELECT author_email FROM posts WHERE id = ?`).bind(postId).first<{ author_email: string }>()
  if (!post) return c.notFound()
  const user = c.var.user
  if (!user.isAdmin && post.author_email !== user.email) {
    return c.text('このメディアを削除する権限がありません', 403)
  }

  const media = await c.env.DB
    .prepare(`SELECT r2_key, post_id FROM media WHERE id = ? AND post_id = ?`)
    .bind(mediaId, postId)
    .first<Media>()

  if (!media) return c.notFound()

  await c.env.BUCKET.delete(media.r2_key)
  await c.env.DB.prepare(`DELETE FROM media WHERE id = ?`).bind(mediaId).run()

  return c.redirect(`/admin/posts/${postId}/edit`)
})
