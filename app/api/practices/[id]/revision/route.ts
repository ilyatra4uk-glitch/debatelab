import { getCurrentUserState } from "@/app/lib/current-user";
import { getPractice, savePracticeRevision } from "@/app/lib/debate-store";
import { DebateAIError, reviewRevision } from "@/app/lib/debate-ai";

export const maxDuration = 60;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isRegistered, user } = await getCurrentUserState();
  if (!isRegistered) return Response.json({ error: "Please log in." }, { status: 401 });
  try {
    const { id } = await params;
    const { content, turnId } = await request.json();
    if (typeof content !== "string" || content.trim().length < 20 || content.length > 6000) return Response.json({ error: "Write between 20 and 6,000 characters." }, { status: 400 });
    const detail = await getPractice(id, user.userId);
    const original = detail.turns.find((turn) => turn.id === turnId && turn.speaker === "user");
    if (!detail.score || !original) return Response.json({ error: "Finish the round and choose one of your speeches." }, { status: 400 });
    const feedback = await reviewRevision(detail.debate, original, content.trim());
    const revision = await savePracticeRevision(user.userId, { debateId: id, turnId, content: content.trim(), feedback });
    return Response.json({ revision });
  } catch (error) {
    return Response.json({ error: error instanceof DebateAIError ? error.message : "Could not save your revision. Please try again." }, { status: error instanceof DebateAIError ? error.status : error instanceof Error && /not found/i.test(error.message) ? 404 : 500 });
  }
}
