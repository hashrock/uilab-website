import { createRoute } from 'honox/factory'

type Media = {
  r2_key: string
  post_id: number
}

export const POST = createRoute(async (c) => {
  const postId = Number(c.req.param('id'))
  const mediaId = Number(c.req.param('mediaId'))
  if (isNaN(postId) || isNaN(mediaId)) return c.notFound()

  const media = await c.env.DB
    .prepare(`SELECT r2_key, post_id FROM media WHERE id = ? AND post_id = ?`)
    .bind(mediaId, postId)
    .first<Media>()

  if (!media) return c.notFound()

  await c.env.BUCKET.delete(media.r2_key)
  await c.env.DB.prepare(`DELETE FROM media WHERE id = ?`).bind(mediaId).run()

  return c.redirect(`/admin/posts/${postId}/edit`)
})
