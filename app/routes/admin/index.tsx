import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB
  const stats = await db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
      FROM posts`
    )
    .first<{ total: number; published: number; draft: number }>()

  const recentPosts = await db
    .prepare(
      `SELECT id, title, slug, status, created_at FROM posts ORDER BY created_at DESC LIMIT 5`
    )
    .all<{ id: number; title: string; slug: string; status: string; created_at: string }>()

  return c.render(
    <div>
      <h1 class="text-2xl font-bold mb-6">ダッシュボード</h1>

      <div class="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="記事合計" value={stats?.total ?? 0} />
        <StatCard label="公開中" value={stats?.published ?? 0} color="green" />
        <StatCard label="下書き" value={stats?.draft ?? 0} color="yellow" />
      </div>

      <div class="bg-white rounded-lg border border-gray-200">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 class="font-semibold">最近の記事</h2>
          <a href="/admin/posts/new" class="text-sm bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700">
            + 新規作成
          </a>
        </div>
        <ul>
          {recentPosts.results.length === 0 ? (
            <li class="px-5 py-8 text-center text-gray-400">記事がまだありません</li>
          ) : (
            recentPosts.results.map((post) => (
              <li key={post.id} class="flex items-center justify-between px-5 py-3 border-b border-gray-100 last:border-0">
                <div>
                  <a href={`/admin/posts/${post.id}/edit`} class="font-medium hover:underline">
                    {post.title}
                  </a>
                  <div class="text-xs text-gray-400 mt-0.5">{post.created_at}</div>
                </div>
                <StatusBadge status={post.status} />
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    { title: 'ダッシュボード' }
  )
})

function StatCard({ label, value, color }: { label: string; value: number; color?: 'green' | 'yellow' }) {
  const valueClass = color === 'green'
    ? 'text-green-600'
    : color === 'yellow'
    ? 'text-yellow-600'
    : 'text-gray-900'

  return (
    <div class="bg-white rounded-lg border border-gray-200 px-5 py-4">
      <div class="text-sm text-gray-500">{label}</div>
      <div class={`text-3xl font-bold mt-1 ${valueClass}`}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">公開</span>
  }
  return <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">下書き</span>
}
