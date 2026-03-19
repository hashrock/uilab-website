// DBからadmin判定を行う
export async function isAdminEmail(db: D1Database, email: string): Promise<boolean> {
  const user = await db
    .prepare(`SELECT is_admin FROM users WHERE email = ?`)
    .bind(email)
    .first<{ is_admin: number }>()
  return user?.is_admin === 1
}
