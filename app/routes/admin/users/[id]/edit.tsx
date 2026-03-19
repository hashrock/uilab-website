import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

type User = {
  id: number
  email: string
  name: string
  picture: string
  is_admin: number
  created_at: string
  updated_at: string
}

const userSchema = z.object({
  is_admin: z.enum(['0', '1']),
})

export const POST = createRoute(
  zValidator('form', userSchema),
  async (c) => {
    const id = Number(c.req.param('id'))
    const data = c.req.valid('form')
    const db = c.env.DB

    const target = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first<User>()
    if (!target) return c.notFound()

    // 自分自身のadmin権限を外すのを防止
    if (target.email === c.var.user.email && data.is_admin === '0') {
      return c.render(
        <EditForm user={target} error="自分自身の管理者権限を外すことはできません" />,
        { title: 'ユーザー編集' }
      )
    }

    await db
      .prepare(`UPDATE users SET is_admin = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(Number(data.is_admin), id)
      .run()

    return c.redirect('/admin/users')
  }
)

export const DELETE = createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB

  const target = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first<User>()
  if (!target) return c.notFound()

  // 自分自身は削除不可
  if (target.email === c.var.user.email) {
    return c.text('自分自身を削除することはできません', 400)
  }

  await db.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run()
  return c.redirect('/admin/users')
})

export default createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB

  const user = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first<User>()
  if (!user) return c.notFound()

  return c.render(
    <EditForm user={user} />,
    { title: 'ユーザー編集' }
  )
})

function EditForm({ user, error }: { user: User; error?: string }) {
  const isSelf = false // サーバー側で判定済み

  return (
    <div>
      <div class="flex items-center gap-3 mb-6">
        <a href="/admin/users" class="text-gray-400 hover:text-gray-600 text-sm">← 一覧に戻る</a>
        <h1 class="text-2xl font-bold">ユーザー編集</h1>
        <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
      </div>

      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div class="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
        {/* ユーザー情報（読み取り専用） */}
        <div class="flex items-center gap-4">
          {user.picture && (
            <img src={user.picture} alt="" class="w-12 h-12 rounded-full" referrerpolicy="no-referrer" />
          )}
          <div>
            <p class="font-medium">{user.name || '-'}</p>
            <p class="text-sm text-gray-500 font-mono">{user.email}</p>
          </div>
        </div>

        <form method="post" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">権限</label>
            <select
              name="is_admin"
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="0" selected={user.is_admin === 0}>一般ユーザー</option>
              <option value="1" selected={user.is_admin === 1}>管理者</option>
            </select>
          </div>

          <div class="flex items-center justify-between">
            <button
              type="submit"
              class="bg-gray-900 text-white px-5 py-2 rounded hover:bg-gray-700 text-sm"
            >
              保存
            </button>
            <button
              type="button"
              class="text-red-500 hover:text-red-700 text-sm"
              onclick={`if(confirm('このユーザーを削除しますか？削除すると、このユーザーの記事は残りますが編集できなくなります。')){fetch('/admin/users/${user.id}/edit',{method:'DELETE'}).then(r=>{if(r.ok)location.href='/admin/users';else r.text().then(t=>alert(t))})}`}
            >
              ユーザーを削除
            </button>
          </div>
        </form>

        <div class="text-xs text-gray-400">
          <p>登録日: {user.created_at} · 更新日: {user.updated_at}</p>
        </div>
      </div>
    </div>
  )
}
