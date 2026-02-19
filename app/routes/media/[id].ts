import { createRoute } from 'honox/factory'

type Media = {
  r2_key: string
  mime_type: string
  filename: string
}

export default createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.notFound()

  const media = await c.env.DB
    .prepare(`SELECT r2_key, mime_type, filename FROM media WHERE id = ?`)
    .bind(id)
    .first<Media>()

  if (!media) return c.notFound()

  const object = await c.env.BUCKET.get(media.r2_key)
  if (!object) return c.notFound()

  return new Response(object.body, {
    headers: {
      'Content-Type': media.mime_type,
    },
  })
})
