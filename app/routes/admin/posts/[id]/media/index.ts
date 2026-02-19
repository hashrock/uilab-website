import { createRoute } from 'honox/factory'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/ogg',
])

const MAX_SIZE = 100 * 1024 * 1024 // 100MB

export const POST = createRoute(async (c) => {
  const postId = Number(c.req.param('id'))
  if (isNaN(postId)) return c.notFound()

  const body = await c.req.parseBody()
  const file = body['file']

  if (!(file instanceof File)) {
    return c.json({ error: 'ファイルが見つかりません' }, 400)
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return c.json({ error: '対応していないファイル形式です' }, 400)
  }

  if (file.size > MAX_SIZE) {
    return c.json({ error: 'ファイルサイズは100MB以下にしてください' }, 400)
  }

  const uuid = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? ''
  const r2Key = ext ? `${uuid}.${ext}` : uuid
  const safeFilename = file.name.replace(/[^\w.\-]/g, '_')

  await c.env.BUCKET.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })

  const result = await c.env.DB
    .prepare(
      `INSERT INTO media (post_id, r2_key, filename, mime_type, size) VALUES (?, ?, ?, ?, ?)`
    )
    .bind(postId, r2Key, safeFilename, file.type, file.size)
    .run()

  const mediaId = result.meta.last_row_id

  return c.redirect(`/admin/posts/${postId}/edit`)
})
