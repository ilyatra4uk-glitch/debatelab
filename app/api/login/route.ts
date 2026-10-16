import { NextResponse } from "next/server";
import { authenticatePasswordUser, createPasswordSession, normalizeLogin, validateLogin } from "@/app/lib/password-auth";
import { registeredUserCookieName } from "@/app/lib/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { login?: string; password?: string };
    const login = normalizeLogin(payload.login ?? "");
    const password = payload.password ?? "";
    if (validateLogin(login) || !password) return Response.json({ error: "Enter your login and password." }, { status: 400 });
    const user = await authenticatePasswordUser({ login, password });
    if (!user) return Response.json({ error: "Incorrect login or password." }, { status: 401 });
    const session = await createPasswordSession(user.userId);
    const response = NextResponse.json({ user: { displayName: user.displayName, login } });
    response.cookies.set({ name: registeredUserCookieName(), value: session.id, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
}
