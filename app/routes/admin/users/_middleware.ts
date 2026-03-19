import { createMiddleware } from 'hono/factory'

const adminOnlyMiddleware = createMiddleware(async (c, next) => {
  const user = c.var.user
  if (!user.isAdmin) {
    return c.text('権限がありません', 403)
  }
  await next()
})

export default [adminOnlyMiddleware]
