export type EventFormValues = {
  title: string
  connpass_url: string
  description: string
  started_at: string
  ended_at: string
  place: string
  address: string
  limit_count: number
  status: string
}

export function EventFormFields({
  values,
}: {
  values?: Partial<EventFormValues>
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
          <label class="block text-sm font-medium mb-1">Connpass URL</label>
          <input
            type="url"
            name="connpass_url"
            value={v.connpass_url ?? ''}
            placeholder="https://connpass.com/event/..."
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">説明</label>
          <textarea
            name="description"
            rows={6}
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {v.description ?? ''}
          </textarea>
        </div>
      </section>

      {/* 日時 */}
      <section class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="font-semibold text-sm text-gray-500 uppercase tracking-wide">日時</h2>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">開始日時</label>
            <input
              type="datetime-local"
              name="started_at"
              value={v.started_at ?? ''}
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">終了日時</label>
            <input
              type="datetime-local"
              name="ended_at"
              value={v.ended_at ?? ''}
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </section>

      {/* 会場 */}
      <section class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="font-semibold text-sm text-gray-500 uppercase tracking-wide">会場</h2>

        <div>
          <label class="block text-sm font-medium mb-1">会場名</label>
          <input
            type="text"
            name="place"
            value={v.place ?? ''}
            placeholder="○○ビル 3F"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">住所</label>
          <input
            type="text"
            name="address"
            value={v.address ?? ''}
            placeholder="東京都渋谷区..."
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">定員</label>
          <input
            type="number"
            name="limit_count"
            value={v.limit_count ?? 0}
            min="0"
            class="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
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
