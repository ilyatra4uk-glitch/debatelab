import {
  createMagicLoginToken,
  getUserByEmail,
} from "@/app/lib/debate-store";
import {
  getSupabaseAuthClient,
  isSupabaseAuthConfigured,
} from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string };
    const email = payload.email?.trim().toLowerCase() ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return Response.json(
        { error: "No profile found for this email. Create a profile first." },
        { status: 404 },
      );
    }

    const magicLink = new URL("/api/login/verify", request.url);

    if (isSupabaseAuthConfigured()) {
      magicLink.pathname = "/api/login/callback";
      const { error } = await getSupabaseAuthClient().auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: magicLink.toString(),
          shouldCreateUser: false,
        },
      });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json(
        {
          emailSent: true,
          message: "Check your email for your DebateLab magic link.",
        },
        { status: 200 },
      );
    }

    const { token, expiresAt } = await createMagicLoginToken(email);
    magicLink.searchParams.set("token", token);

    return Response.json(
      {
        expiresAt,
        magicLink: magicLink.toString(),
        message: "Magic link created.",
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
