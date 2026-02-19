import { createMiddleware } from 'hono/factory'

const cfAccessMiddleware = createMiddleware(async (c, next) => {
  // Cloudflare Access は本番環境でリクエストをブロックします。
  // このミドルウェアはJWTからユーザー情報を取り出すだけです。
  const jwt = c.req.header('CF-Access-Jwt-Assertion')

  if (jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]))
      c.set('userEmail', payload.email ?? 'unknown')
    } catch {
      c.set('userEmail', 'unknown')
    }
  } else {
    // ローカル開発時はCF Accessなし
    c.set('userEmail', 'dev@local')
  }

  await next()
})

// honox の _middleware.ts は配列をエクスポートする必要がある
export default [cfAccessMiddleware]
