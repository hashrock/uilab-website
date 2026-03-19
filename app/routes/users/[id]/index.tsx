import { createRoute } from 'honox/factory'
import { isVideo } from '../../../lib/media'

type UserProfile = {
  id: number
  name: string
  picture: string
  display_name: string
  bio: string
  website_url: string
}

type Post = {
  id: number
  title: string
  slug: string
  content: string
  tags: string
  created_at: string
  thumbnail_id: number | null
  thumbnail_mime_type: string | null
}

export default createRoute(async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.notFound()

  const db = c.env.DB

  const user = await db
    .prepare(`SELECT id, name, picture, display_name, bio, website_url FROM users WHERE id = ?`)
    .bind(id)
    .first<UserProfile>()

  if (!user) return c.notFound()

  const displayName = user.display_name || user.name

  // このユーザーが作成した記事 + このユーザーが作者として紐づいた記事
  const posts = await db
    .prepare(
      `SELECT DISTINCT p.id, p.title, p.slug, p.content, p.tags, p.created_at,
        COALESCE(p.thumbnail_id, (SELECT m.id FROM media m WHERE m.post_id = p.id ORDER BY m.sort_order ASC, m.created_at ASC LIMIT 1)) AS thumbnail_id,
        (SELECT m.mime_type FROM media m WHERE m.id = COALESCE(p.thumbnail_id, (SELECT m2.id FROM media m2 WHERE m2.post_id = p.id ORDER BY m2.sort_order ASC, m2.created_at ASC LIMIT 1))) AS thumbnail_mime_type
       FROM posts p
       WHERE p.status = 'published' AND (p.author_user_id = ? OR p.author_email = (SELECT email FROM users WHERE id = ?))
       ORDER BY p.created_at DESC`
    )
    .bind(id, id)
    .all<Post>()

  return c.render(
    <div class="min-h-screen bg-[#f5f0eb]">
      <title>{displayName} - UI Lab</title>
      <div class="max-w-3xl mx-auto px-4 py-16">
        <a href="/" class="text-sm text-gray-400 hover:text-gray-700 mb-8 inline-block">
          ← Back
        </a>

        {/* プロフィール */}
        <div class="flex items-center gap-5 mb-8">
          {user.picture && (
            <img src={user.picture} alt="" class="w-20 h-20 rounded-full" referrerpolicy="no-referrer" />
          )}
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{displayName}</h1>
            {user.bio && <p class="text-sm text-gray-500 mt-1">{user.bio}</p>}
            {user.website_url && (
              <a href={user.website_url} target="_blank" rel="noopener noreferrer" class="text-sm text-blue-600 hover:underline mt-1 inline-block">
                {user.website_url}
              </a>
            )}
          </div>
        </div>

        {/* 投稿一覧 */}
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Posts</h2>
        {posts.results.length === 0 ? (
          <p class="text-gray-400 text-sm">投稿はまだありません</p>
        ) : (
          <div class="columns-1 sm:columns-2 gap-4">
            {posts.results.map((post) => {
              const tags = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
              return (
                <a
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  class="block break-inside-avoid mb-4 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 group"
                >
                  {post.thumbnail_id && (
                    <div class="overflow-hidden aspect-[4/3]">
                      {post.thumbnail_mime_type && isVideo(post.thumbnail_mime_type) ? (
                        <video
                          src={`/media/${post.thumbnail_id}`}
                          class="w-full h-full object-cover"
                          autoplay muted loop playsinline
                        />
                      ) : (
                        <img
                          src={`/media/${post.thumbnail_id}`}
                          alt={post.title}
                          class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          loading="lazy"
                        />
                      )}
                    </div>
                  )}
                  <div class="p-4">
                    <h3 class="font-semibold text-gray-900 text-sm">{post.title}</h3>
                    {tags.length > 0 && (
                      <div class="flex flex-wrap gap-1 mt-2">
                        {tags.map((tag) => (
                          <span key={tag} class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})
