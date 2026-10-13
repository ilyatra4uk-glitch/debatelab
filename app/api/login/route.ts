import {
  createMagicLoginToken,
  getUserByEmail,
} from "@/app/lib/debate-store";

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

    const { token, expiresAt } = await createMagicLoginToken(email);
    const magicLink = new URL("/api/login/verify", request.url);
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
