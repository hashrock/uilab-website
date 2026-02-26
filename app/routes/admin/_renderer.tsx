import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { Link } from 'honox/server'

export default jsxRenderer(({ children, title }) => {
  const c = useRequestContext()
  const user = c.var.user
  const path = new URL(c.req.url).pathname

  const navLink = (href: string, label: string) => {
    const isActive = path.startsWith(href)
    return (
      <a
        href={href}
        class={`text-sm ${isActive ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
      >
        {label}
      </a>
    )
  }

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
            {navLink('/admin/posts', '記事')}
            {navLink('/admin/events', 'イベント')}
          </div>
          <div class="flex items-center gap-4">
            <a href="/" class="text-gray-400 hover:text-white text-sm">
              ← サイトへ
            </a>
            <div class="flex items-center gap-2">
              {user.picture && (
                <img
                  src={user.picture}
                  alt=""
                  class="w-6 h-6 rounded-full"
                  referrerpolicy="no-referrer"
                />
              )}
              <span class="text-gray-400 text-sm">{user.name || user.email}</span>
            </div>
            <a
              href="/auth/logout"
              class="text-gray-500 hover:text-white text-xs border border-gray-700 rounded px-2 py-1"
            >
              ログアウト
            </a>
          </div>
        </nav>
        <main class="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
})
