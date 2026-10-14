import { NextResponse } from "next/server";
import {
  encodeRegisteredUser,
  registeredUserCookieName,
} from "@/app/lib/current-user";
import {
  getOrCreateUser,
  getUserByEmail,
} from "@/app/lib/debate-store";
import {
  getSupabaseAuthClient,
  isSupabaseAuthConfigured,
} from "@/app/lib/supabase-server";
import type { ChatGPTUser } from "@/app/chatgpt-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      displayName?: string;
      email?: string;
    };
    const displayName = payload.displayName?.trim() ?? "";
    const email = payload.email?.trim().toLowerCase() ?? "";

    if (displayName.length < 2) {
      return Response.json(
        { error: "Enter your name." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }
    const user: ChatGPTUser = {
      userId: `registered:${email}`,
      displayName,
      email,
      fullName: displayName,
    };
    if (await getUserByEmail(email)) {
      return Response.json(
        { error: "This email is already registered. Log in with this email." },
        { status: 409 },
      );
    }
    const storedUser = await getOrCreateUser(user);

    if (isSupabaseAuthConfigured()) {
      const callbackUrl = new URL("/api/login/callback", request.url);
      const { error } = await getSupabaseAuthClient().auth.signInWithOtp({
        email,
        options: {
          data: {
            display_name: displayName,
            full_name: displayName,
          },
          emailRedirectTo: callbackUrl.toString(),
          shouldCreateUser: true,
        },
      });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json(
        {
          emailSent: true,
          user: storedUser,
        },
        { status: 201 },
      );
    }

    const response = NextResponse.json({ user: storedUser }, { status: 201 });
    response.cookies.set({
      name: registeredUserCookieName(),
      value: encodeRegisteredUser(user),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
