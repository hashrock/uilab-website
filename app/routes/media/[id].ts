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

  const rangeHeader = c.req.header('Range')

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
    if (match) {
      const start = match[1] ? parseInt(match[1]) : undefined
      const end = match[2] ? parseInt(match[2]) : undefined
      const range: { offset?: number; length?: number } = {}
      if (start !== undefined) range.offset = start
      if (start !== undefined && end !== undefined) range.length = end - start + 1

      const rangedObject = await c.env.BUCKET.get(media.r2_key, { range })
      if (!rangedObject) return c.notFound()

      const total = rangedObject.size
      const rangeStart = start ?? 0
      const rangeEnd = end ?? total - 1

      const headers = new Headers()
      headers.set('Content-Type', media.mime_type)
      headers.set('Content-Range', `bytes ${rangeStart}-${rangeEnd}/${total}`)
      headers.set('Accept-Ranges', 'bytes')
      headers.set('Content-Length', String(rangeEnd - rangeStart + 1))

      return new Response(rangedObject.body, { status: 206, headers })
    }
  }

  const object = await c.env.BUCKET.get(media.r2_key)
  if (!object) return c.notFound()

  const headers = new Headers()
  headers.set('Content-Type', media.mime_type)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('Content-Disposition', `inline; filename="${media.filename}"`)
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Content-Length', String(object.size))

  return new Response(object.body, { headers })
})
