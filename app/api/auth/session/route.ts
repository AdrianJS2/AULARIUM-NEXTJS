// RUTA: app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import * as cookie from "cookie"; // HE AQUÍ LA CORRECCIÓN
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.session_token;

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const userPayload = verifyToken(token);

    if (!userPayload) {
        return NextResponse.json({ user: null }, { status: 401 });
    }
    
    return NextResponse.json({ user: userPayload });
}