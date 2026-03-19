import { useState, useCallback } from 'hono/jsx'

type MediaItem = {
  id: number
  filename: string
  mime_type: string
  size: number
}

type Props = {
  postId: number
  initialMedia: MediaItem[]
  initialThumbnailId: number | null
}

export default function MediaManager({ postId, initialMedia, initialThumbnailId }: Props) {
  const [items, setItems] = useState(initialMedia)
  const [thumbnailId, setThumbnailId] = useState<number | null>(initialThumbnailId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const save = useCallback(async (newItems: MediaItem[], newThumbId: number | null) => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/admin/posts/${postId}/media-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: newItems.map((m) => m.id),
          thumbnail_id: newThumbId,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [postId])

  const moveItem = useCallback((from: number, to: number) => {
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      save(next, thumbnailId)
      return next
    })
  }, [thumbnailId, save])

  const selectThumbnail = useCallback((id: number | null) => {
    setThumbnailId(id)
    save(items, id)
  }, [items, save])

  if (items.length === 0) {
    return (
      <div class="px-5 py-8 text-center text-gray-400 text-sm">
        アップロードされたメディアはありません
      </div>
    )
  }

  return (
    <div>
      {/* ステータス */}
      <div class="px-5 py-2 text-xs text-gray-400 flex items-center justify-between">
        <span>ドラッグで並び替え・クリックでサムネイル選択</span>
        {saving && <span class="text-yellow-600">保存中...</span>}
        {saved && <span class="text-green-600">保存しました</span>}
      </div>

      <ul class="divide-y divide-gray-100">
        {items.map((m, i) => {
          const isThumb = thumbnailId === m.id
          return (
            <li
              key={m.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== i) moveItem(dragIdx, i)
                setDragIdx(null)
              }}
              onDragEnd={() => setDragIdx(null)}
              class={`px-5 py-3 flex items-center gap-4 cursor-grab active:cursor-grabbing ${
                dragIdx === i ? 'opacity-50' : ''
              } ${isThumb ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}
            >
              {/* 順番 */}
              <span class="text-xs text-gray-300 w-5 text-center flex-shrink-0">{i + 1}</span>

              {/* サムネイル */}
              <div class="w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {m.mime_type.startsWith('image/') ? (
                  <img src={`/media/${m.id}`} alt={m.filename} class="w-full h-full object-cover" />
                ) : (
                  <span class="text-2xl">🎬</span>
                )}
              </div>

              {/* ファイル情報 */}
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{m.filename}</p>
                <p class="text-xs text-gray-400">{m.mime_type} · {formatSize(m.size)}</p>
                <p class="text-xs text-gray-300 mt-0.5 font-mono">/media/{m.id}</p>
              </div>

              {/* アクション */}
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  class={`text-xs px-2 py-1 rounded ${
                    isThumb
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700'
                  }`}
                  onClick={() => selectThumbnail(isThumb ? null : m.id)}
                >
                  {isThumb ? 'サムネイル' : 'サムネに設定'}
                </button>
                <button
                  type="button"
                  class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                  onClick={() => {
                    navigator.clipboard.writeText(`/media/${m.id}`)
                  }}
                >
                  URLコピー
                </button>
                <form
                  method="post"
                  action={`/admin/posts/${postId}/media/${m.id}/delete`}
                  onSubmit={(e: Event) => {
                    if (!confirm('このメディアを削除しますか？')) e.preventDefault()
                  }}
                >
                  <button type="submit" class="text-xs text-red-500 hover:text-red-700 px-2 py-1">
                    削除
                  </button>
                </form>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
