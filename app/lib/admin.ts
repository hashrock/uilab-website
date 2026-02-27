// 管理者メールアドレスのリスト
const ADMIN_EMAILS = ['hashedrock@gmail.com']

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email)
}
