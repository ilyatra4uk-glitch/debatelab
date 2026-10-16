import { getChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { registeredUserCookieName } from "@/app/lib/current-user";
import { getSupabaseDatabaseClient, isSupabaseDatabaseConfigured } from "@/app/lib/supabase-server";

export async function POST() {
  const cookieName = registeredUserCookieName();
  const sessionId = (await cookies()).get(cookieName)?.value;
  if (sessionId && isSupabaseDatabaseConfigured()) {
    const { error } = await getSupabaseDatabaseClient().from("user_sessions").delete().eq("id", sessionId);
    if (error) return NextResponse.json({ error: "Could not sign out." }, { status: 500 });
  }
  const response = NextResponse.json({ ok: true, redirectTo: (await getChatGPTUser()) ? chatGPTSignOutPath("/login") : "/login" });
  response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
