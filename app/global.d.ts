import type {} from 'hono'

declare module 'hono' {
  interface Env {
    Variables: {
      userEmail: string
    }
    Bindings: {
      DB: D1Database
      BUCKET: R2Bucket
    }
  }

  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response
  }
}
