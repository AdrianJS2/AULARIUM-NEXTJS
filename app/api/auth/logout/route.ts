import { NextResponse } from "next/server"

export async function POST() {
  const res = NextResponse.json({ ok: true })

  // Debe coincidir nombre, path y SameSite con la cookie original
  const base =
    "authToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"

  // Dev/Local (sin Secure)
  res.headers.append("Set-Cookie", base)

  // Prod (HTTPS) – también con Secure
  if (process.env.NODE_ENV !== "development") {
    res.headers.append("Set-Cookie", `${base}; Secure`)
  }

  res.headers.set("Cache-Control", "no-store")
  return res
}
