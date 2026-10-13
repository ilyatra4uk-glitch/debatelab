import { NextResponse } from "next/server";
import {
  encodeRegisteredUser,
  registeredUserCookieName,
} from "@/app/lib/current-user";
import { consumeMagicLoginToken } from "@/app/lib/debate-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const redirectUrl = new URL("/", url.origin);

  if (!token) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "missing-token");
    return NextResponse.redirect(redirectUrl);
  }

  const user = await consumeMagicLoginToken(token);
  if (!user) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
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
}
