import { createMiddleware } from 'hono/factory'
import { getSession } from '../../lib/session'
import { isAdminEmail } from '../../lib/admin'

const authMiddleware = createMiddleware(async (c, next) => {
  // 明示的に DEV_MODE=true が設定されている場合のみ開発用ユーザーを使用
  if (c.env.DEV_MODE === 'true') {
    c.set('user', { email: 'dev@local', name: 'Developer', picture: '', isAdmin: true })
    return next()
  }

  // SESSION_SECRET が未設定の場合は fail closed（認証拒否）
  if (!c.env.SESSION_SECRET) {
    return c.text('Server configuration error', 500)
  }

  const session = await getSession(c)

  if (!session) {
    return c.redirect('/auth/login')
  }

  c.set('user', {
    email: session.email,
    name: session.name,
    picture: session.picture,
    isAdmin: isAdminEmail(session.email),
  })

  await next()
})

// honox の _middleware.ts は配列をエクスポートする必要がある
export default [authMiddleware]
