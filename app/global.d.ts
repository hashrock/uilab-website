import type {} from 'hono'

declare module 'hono' {
  interface Env {
    Variables: {
      user: {
        email: string
        name: string
        picture: string
        isAdmin: boolean
      }
    }
    Bindings: {
      DB: D1Database
      BUCKET: R2Bucket
      GOOGLE_CLIENT_ID: string
      GOOGLE_CLIENT_SECRET: string
      SESSION_SECRET: string
      DEV_MODE?: string
    }
  }

  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response
  }
}
