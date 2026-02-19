import { createRoute } from 'honox/factory'

type Post = {
  id: number
  title: string
  slug: string
  status: string
  created_at: string
  updated_at: string
}

export default createRoute(async (c) => {
  const db = c.env.DB
  const posts = await db
    .prepare(`SELECT id, title, slug, status, created_at, updated_at FROM posts ORDER BY created_at DESC`)
    .all<Post>()

  return c.render(
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">記事一覧</h1>
        <a href="/admin/posts/new" class="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm">
          + 新規作成
        </a>
      </div>

      <div class="bg-white rounded-lg border border-gray-200">
        {posts.results.length === 0 ? (
          <div class="px-5 py-12 text-center text-gray-400">
            <p class="mb-3">記事がまだありません</p>
            <a href="/admin/posts/new" class="text-gray-900 underline text-sm">最初の記事を作成する</a>
          </div>
        ) : (
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-gray-500">
                <th class="px-5 py-3 font-medium">タイトル</th>
                <th class="px-5 py-3 font-medium">スラッグ</th>
                <th class="px-5 py-3 font-medium">ステータス</th>
                <th class="px-5 py-3 font-medium">更新日</th>
                <th class="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {posts.results.map((post) => (
                <tr key={post.id} class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td class="px-5 py-3">
                    <a href={`/admin/posts/${post.id}/edit`} class="font-medium hover:underline">
                      {post.title}
                    </a>
                  </td>
                  <td class="px-5 py-3 text-gray-400 font-mono text-xs">{post.slug}</td>
                  <td class="px-5 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td class="px-5 py-3 text-gray-400">{post.updated_at.slice(0, 10)}</td>
                  <td class="px-5 py-3">
                    <a href={`/admin/posts/${post.id}/edit`} class="text-gray-500 hover:text-gray-900">
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
    { title: '記事一覧' }
  )
})

function StatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">公開</span>
  }
  return <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">下書き</span>
}
