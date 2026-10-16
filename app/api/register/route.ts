import { NextResponse } from "next/server";
import { createPasswordSession, normalizeLogin, registerPasswordUser, validateLogin, validatePassword } from "@/app/lib/password-auth";
import { registeredUserCookieName } from "@/app/lib/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { displayName?: string; login?: string; password?: string };
    const displayName = payload.displayName?.trim() ?? "";
    const login = normalizeLogin(payload.login ?? "");
    const password = payload.password ?? "";
    if (displayName.length < 2) return Response.json({ error: "Enter your name." }, { status: 400 });
    const loginError = validateLogin(login);
    if (loginError) return Response.json({ error: loginError }, { status: 400 });
    const passwordError = validatePassword(password);
    if (passwordError) return Response.json({ error: passwordError }, { status: 400 });
    const user = await registerPasswordUser({ login, password, displayName });
    const session = await createPasswordSession(user.userId);
    const response = NextResponse.json({ user: { displayName: user.displayName, login } }, { status: 201 });
    response.cookies.set({ name: registeredUserCookieName(), value: session.id, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
}
