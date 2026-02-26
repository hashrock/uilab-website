import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  const url = new URL(c.req.url)
  const redirectUri = `${url.origin}/auth/google/callback`

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  })

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})
