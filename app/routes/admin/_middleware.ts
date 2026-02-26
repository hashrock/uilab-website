import { createMiddleware } from 'hono/factory'
import { getSession } from '../../lib/session'
import { isAdminEmail } from '../../lib/admin'

const authMiddleware = createMiddleware(async (c, next) => {
  // ローカル開発時（SESSION_SECRET 未設定）はデフォルトユーザーを使用
  if (!c.env.SESSION_SECRET) {
    c.set('user', { email: 'dev@local', name: 'Developer', picture: '', isAdmin: true })
    return next()
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
