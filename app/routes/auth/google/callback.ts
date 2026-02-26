import { createRoute } from 'honox/factory'
import { createSession } from '../../../lib/session'

type GoogleTokenResponse = {
  access_token: string
  token_type: string
}

type GoogleUserInfo = {
  email: string
  name: string
  picture: string
}

export default createRoute(async (c) => {
  const code = c.req.query('code')
  if (!code) {
    return c.text('認証コードがありません', 400)
  }

  const url = new URL(c.req.url)
  const redirectUri = `${url.origin}/auth/google/callback`

  // Exchange authorization code for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text()
    console.error('Token exchange failed:', tokenRes.status, errorBody)
    return c.text(`トークンの取得に失敗しました: ${errorBody}`, 500)
  }

  const tokenData = await tokenRes.json<GoogleTokenResponse>()

  // Fetch user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!userRes.ok) {
    return c.text('ユーザー情報の取得に失敗しました', 500)
  }

  const userInfo = await userRes.json<GoogleUserInfo>()

  // Create session cookie
  const cookie = await createSession(c, {
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
  })

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin',
      'Set-Cookie': cookie,
    },
  })
})
