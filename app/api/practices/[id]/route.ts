import { getCurrentUserState } from "@/app/lib/current-user";
import { getPractice } from "@/app/lib/debate-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isRegistered, user } = await getCurrentUserState();
  if (!isRegistered) return Response.json({ error: "Please log in." }, { status: 401 });
  try {
    return Response.json(await getPractice((await params).id, user.userId));
  } catch {
    return Response.json({ error: "Practice not found or unavailable." }, { status: 404 });
  }
}
