// app/api/carreras/route.ts
import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { isAdmin } from "@/lib/auth-server"
import { cookies, headers } from "next/headers"
import jwt from "jsonwebtoken"

const COOKIE_NAME = "authToken" // ✅ tu cookie real

function getBearer() {
  const auth = headers().get("authorization")
  if (!auth) return null
  const [type, value] = auth.split(" ")
  return type?.toLowerCase() === "bearer" ? value : null
}

function getUserId(): string | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null

  // 1) Bearer (útil para pruebas con Thunder/Postman)
  const bearer = getBearer()
  if (bearer) {
    try {
      const dec: any = jwt.verify(bearer, secret)
      return dec?.id ?? null
    } catch {}
  }

  // 2) Cookie authToken
  const raw = cookies().get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    const dec: any = jwt.verify(raw, secret)
    return dec?.id ?? null
  } catch {
    return null
  }
}

export async function GET() {
  const userId = getUserId()
  if (!userId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[/api/carreras] sin userId. Revisa JWT_SECRET y cookie", {
        hasSecret: Boolean(process.env.JWT_SECRET),
        cookies: cookies().getAll().map(c => c.name),
      })
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 })
  }

  const [rows] = await pool.query("SELECT id, nombre FROM carreras ORDER BY nombre ASC")
  return NextResponse.json(rows)
}
