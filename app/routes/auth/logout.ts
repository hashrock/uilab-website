import { createRoute } from 'honox/factory'
import { clearSessionCookie } from '../../lib/session'

export default createRoute((c) => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': clearSessionCookie(),
    },
  })
})
