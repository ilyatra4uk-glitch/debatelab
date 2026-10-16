import { DebateAIError, judgeDebate } from "@/app/lib/debate-ai";
import { getCurrentUserState } from "@/app/lib/current-user";
import {
  getPractice,
  getOrCreateUser,
  saveScore,
} from "@/app/lib/debate-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { debateId?: string };
    const debateId = payload.debateId?.trim() ?? "";
    if (!debateId) {
      return Response.json({ error: "Debate id is required." }, { status: 400 });
    }

    const { isRegistered, user: authUser } = await getCurrentUserState();
    if (!isRegistered) {
      return Response.json(
        { error: "Create a profile before saving a score." },
        { status: 401 },
      );
    }

    const user = await getOrCreateUser(authUser);
    const { debate, turns, score: existing } = await getPractice(debateId, user.userId);
    if (existing) return Response.json({ score: existing });
    const judged = await judgeDebate(debate, turns);
    const score = await saveScore({
      debateId: debate.id,
      userId: user.userId,
      score: judged,
    });

    return Response.json({ score });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: error instanceof DebateAIError ? error.status : 500 },
    );
  }
}
