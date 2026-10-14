import { NextResponse } from "next/server";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import {
  encodeRegisteredUser,
  registeredUserCookieName,
} from "@/app/lib/current-user";
import { getOrCreateUser, getUserByEmail } from "@/app/lib/debate-store";
import { getSupabaseAuthClient } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  const redirectUrl = new URL("/", url.origin);

  if (!code) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "missing-code");
    return NextResponse.redirect(redirectUrl);
  }

  const { data, error } = await getSupabaseAuthClient().auth.exchangeCodeForSession(code);
  const supabaseUser = data.user;

  if (error || !supabaseUser?.email) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "invalid-code");
    return NextResponse.redirect(redirectUrl);
  }

  const existing = await getUserByEmail(supabaseUser.email);
  const user: ChatGPTUser = existing ?? {
    userId: `supabase:${supabaseUser.id}`,
    email: supabaseUser.email,
    displayName:
      getStringMetadata(supabaseUser.user_metadata.display_name) ??
      supabaseUser.email.split("@")[0],
    fullName:
      getStringMetadata(supabaseUser.user_metadata.full_name) ??
      getStringMetadata(supabaseUser.user_metadata.display_name) ??
      supabaseUser.email.split("@")[0],
  };
  const storedUser = await getOrCreateUser(user);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set({
    name: registeredUserCookieName(),
    value: encodeRegisteredUser(storedUser),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

function getStringMetadata(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
