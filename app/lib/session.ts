import type { Context } from 'hono'

export type SessionPayload = {
  email: string
  name: string
  picture: string
  exp: number
}

const COOKIE_NAME = 'session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(payload, secret)
  return expected === signature
}

export async function createSession(
  c: Context,
  user: { email: string; name: string; picture: string }
): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  }
  const encoded = btoa(JSON.stringify(payload))
  const signature = await sign(encoded, c.env.SESSION_SECRET)
  const cookie = `${encoded}.${signature}`

  return `${COOKIE_NAME}=${cookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}; Secure`
}

export async function getSession(c: Context): Promise<SessionPayload | null> {
  const cookieHeader = c.req.header('Cookie') ?? ''
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  if (!match) return null

  const [encoded, signature] = match[1].split('.')
  if (!encoded || !signature) return null

  const valid = await verify(encoded, signature, c.env.SESSION_SECRET)
  if (!valid) return null

  try {
    const payload: SessionPayload = JSON.parse(atob(encoded))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`
}
