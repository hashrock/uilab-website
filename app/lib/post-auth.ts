// 記事の編集権限チェック（admin / 作成者 / 承認済みコラボレーター）
export async function canEditPost(
  db: D1Database,
  postAuthorEmail: string,
  userEmail: string,
  isAdmin: boolean,
  postId: number
): Promise<boolean> {
  if (isAdmin) return true
  if (postAuthorEmail === userEmail) return true

  const collab = await db
    .prepare(`SELECT id FROM post_collaborators WHERE post_id = ? AND user_email = ? AND status = 'approved'`)
    .bind(postId, userEmail)
    .first()
  return !!collab
}
