export type PostFormValues = {
  title: string
  slug: string
  content: string
  status: string
  author_name: string
  author_url: string
  github_url: string
  demo_url: string
  tags: string
}

export function PostFormFields({
  values,
}: {
  values?: Partial<PostFormValues>
}) {
  const v = values ?? {}

  return (
    <>
      {/* 基本情報 */}
      <section class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="font-semibold text-sm text-gray-500 uppercase tracking-wide">基本情報</h2>

        <div>
          <label class="block text-sm font-medium mb-1">タイトル <span class="text-red-500">*</span></label>
          <input
            type="text"
            name="title"
            value={v.title ?? ''}
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">スラッグ <span class="text-red-500">*</span></label>
          <input
            type="text"
            name="slug"
            value={v.slug ?? ''}
            placeholder="my-post-slug"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
          />
          <p class="text-xs text-gray-400 mt-1">英小文字・数字・ハイフンのみ使用可</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">本文</label>
          <textarea
            name="content"
            rows={10}
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {v.content ?? ''}
          </textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">タグ</label>
          <input
            type="text"
            name="tags"
            value={v.tags ?? ''}
            placeholder="react, animation, css"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p class="text-xs text-gray-400 mt-1">カンマ区切りで複数入力可</p>
        </div>
      </section>

      {/* 作者情報 */}
      <section class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="font-semibold text-sm text-gray-500 uppercase tracking-wide">作者情報</h2>

        <div>
          <label class="block text-sm font-medium mb-1">作者名</label>
          <input
            type="text"
            name="author_name"
            value={v.author_name ?? ''}
            placeholder="Your Name"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">作者ホームページ</label>
          <input
            type="url"
            name="author_url"
            value={v.author_url ?? ''}
            placeholder="https://example.com"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </section>

      {/* リンク */}
      <section class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="font-semibold text-sm text-gray-500 uppercase tracking-wide">リンク</h2>

        <div>
          <label class="block text-sm font-medium mb-1">GitHub Repository</label>
          <input
            type="url"
            name="github_url"
            value={v.github_url ?? ''}
            placeholder="https://github.com/user/repo"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Demo URL</label>
          <input
            type="url"
            name="demo_url"
            value={v.demo_url ?? ''}
            placeholder="https://demo.example.com"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </section>
    </>
  )
}

export function StatusAndSubmit({
  status,
  deleteButton,
}: {
  status?: string
  deleteButton?: any
}) {
  return (
    <div class="flex items-center justify-between py-2">
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="status"
            value="draft"
            checked={!status || status === 'draft'}
          />
          下書き
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="status"
            value="published"
            checked={status === 'published'}
          />
          公開
        </label>
      </div>
      <div class="flex items-center gap-3">
        {deleteButton}
        <button
          type="submit"
          class="bg-gray-900 text-white px-5 py-2 rounded hover:bg-gray-700 text-sm"
        >
          保存
        </button>
      </div>
    </div>
  )
}
