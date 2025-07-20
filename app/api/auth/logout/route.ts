// RUTA: app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import * as cookie from "cookie"; // HE AQUÍ LA CORRECCIÓN
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const serializedCookie = cookie.serialize("session_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: -1,
        path: "/",
        sameSite: "lax",
    });

    return new NextResponse(JSON.stringify({ message: "Sesión cerrada" }), {
        status: 200,
        headers: { "Set-Cookie": serializedCookie },
    });
}