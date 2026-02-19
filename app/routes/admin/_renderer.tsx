import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { Link } from 'honox/server'

export default jsxRenderer(({ children, title }) => {
  const c = useRequestContext()
  const userEmail = c.var.userEmail ?? ''

  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} - Admin` : 'Admin'}</title>
        <Link href="/app/style.css" rel="stylesheet" />
      </head>
      <body class="bg-gray-50 text-gray-900 min-h-screen">
        <nav class="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/admin" class="font-bold text-lg tracking-tight">
              UI Lab Admin
            </a>
            <a href="/admin/posts" class="text-gray-300 hover:text-white text-sm">
              記事
            </a>
            <a href="/admin/events" class="text-gray-300 hover:text-white text-sm">
              イベント
            </a>
          </div>
          <div class="text-gray-400 text-sm">{userEmail}</div>
        </nav>
        <main class="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
})
