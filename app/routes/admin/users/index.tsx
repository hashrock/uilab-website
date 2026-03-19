import { createRoute } from 'honox/factory'

type User = {
  id: number
  email: string
  name: string
  picture: string
  is_admin: number
  created_at: string
  updated_at: string
}

export default createRoute(async (c) => {
  const db = c.env.DB
  const users = await db
    .prepare(`SELECT id, email, name, picture, is_admin, created_at, updated_at FROM users ORDER BY created_at ASC`)
    .all<User>()

  return c.render(
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">ユーザー管理</h1>
        <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
      </div>

      <div class="bg-white rounded-lg border border-gray-200">
        {users.results.length === 0 ? (
          <div class="px-5 py-12 text-center text-gray-400">
            <p>ユーザーがまだいません</p>
          </div>
        ) : (
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-gray-500">
                <th class="px-5 py-3 font-medium">ユーザー</th>
                <th class="px-5 py-3 font-medium">メール</th>
                <th class="px-5 py-3 font-medium">権限</th>
                <th class="px-5 py-3 font-medium">登録日</th>
                <th class="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.results.map((user) => (
                <tr key={user.id} class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-2">
                      {user.picture && (
                        <img
                          src={user.picture}
                          alt=""
                          class="w-6 h-6 rounded-full"
                          referrerpolicy="no-referrer"
                        />
                      )}
                      <span class="font-medium">{user.name || '-'}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-gray-500 font-mono text-xs">{user.email}</td>
                  <td class="px-5 py-3">
                    <RoleBadge isAdmin={user.is_admin === 1} />
                  </td>
                  <td class="px-5 py-3 text-gray-400">{user.created_at.slice(0, 10)}</td>
                  <td class="px-5 py-3">
                    <a href={`/admin/users/${user.id}/edit`} class="text-gray-500 hover:text-gray-900">
                      編集
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>,
    { title: 'ユーザー管理' }
  )
})

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  if (isAdmin) {
    return <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">管理者</span>
  }
  return <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">一般</span>
}
