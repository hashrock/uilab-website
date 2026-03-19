import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

type UserProfile = {
  id: number
  email: string
  name: string
  picture: string
  display_name: string
  bio: string
  website_url: string
}

const profileSchema = z.object({
  display_name: z.string().default(''),
  bio: z.string().default(''),
  website_url: z.string().default(''),
})

export const POST = createRoute(
  zValidator('form', profileSchema),
  async (c) => {
    const data = c.req.valid('form')
    const db = c.env.DB
    const email = c.var.user.email

    await db
      .prepare(`UPDATE users SET display_name = ?, bio = ?, website_url = ?, updated_at = datetime('now') WHERE email = ?`)
      .bind(data.display_name, data.bio, data.website_url, email)
      .run()

    const profile = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first<UserProfile>()

    return c.render(
      <ProfileForm profile={profile!} saved />,
      { title: 'プロフィール' }
    )
  }
)

export default createRoute(async (c) => {
  const db = c.env.DB
  const email = c.var.user.email

  const profile = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first<UserProfile>()
  if (!profile) return c.text('ユーザーが見つかりません', 404)

  return c.render(
    <ProfileForm profile={profile} />,
    { title: 'プロフィール' }
  )
})

function ProfileForm({ profile, saved }: { profile: UserProfile; saved?: boolean }) {
  return (
    <div>
      <div class="flex items-center gap-3 mb-6">
        <h1 class="text-2xl font-bold">プロフィール編集</h1>
      </div>

      {saved && (
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
          保存しました
        </div>
      )}

      <div class="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
        {/* 読み取り専用情報 */}
        <div class="flex items-center gap-4 pb-4 border-b border-gray-100">
          {profile.picture && (
            <img src={profile.picture} alt="" class="w-16 h-16 rounded-full" referrerpolicy="no-referrer" />
          )}
          <div>
            <p class="font-medium">{profile.name}</p>
            <p class="text-sm text-gray-500 font-mono">{profile.email}</p>
            <p class="text-xs text-gray-400 mt-1">
              公開ページ: <a href={`/users/${profile.id}`} class="text-blue-600 hover:underline">/users/{profile.id}</a>
            </p>
          </div>
        </div>

        <form method="post" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">表示名</label>
            <input
              type="text"
              name="display_name"
              value={profile.display_name}
              placeholder={profile.name}
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p class="text-xs text-gray-400 mt-1">空の場合はGoogleアカウントの名前が使われます</p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">自己紹介</label>
            <textarea
              name="bio"
              rows={4}
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >{profile.bio}</textarea>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Webサイト</label>
            <input
              type="url"
              name="website_url"
              value={profile.website_url}
              placeholder="https://example.com"
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div class="pt-2">
            <button
              type="submit"
              class="bg-gray-900 text-white px-5 py-2 rounded hover:bg-gray-700 text-sm"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
