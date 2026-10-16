import { getCurrentUserState } from "@/app/lib/current-user";
import { getPractice, getOrCreateUser, savePracticeExchange } from "@/app/lib/debate-store";
import { DebateAIError, generateBotReply } from "@/app/lib/debate-ai";
import type { DebateSide } from "@/app/lib/debate-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { isRegistered, user } = await getCurrentUserState();
    if (!isRegistered) return Response.json({ error: "Please log in to practice." }, { status: 401 });
    const payload = await request.json();
    const argument = typeof payload.argument === "string" ? payload.argument.trim() : "";
    if (argument.length < 20 || argument.length > 6000) return Response.json({ error: "Write between 20 and 6,000 characters for your speech." }, { status: 400 });
    const debateId = typeof payload.debateId === "string" ? payload.debateId : undefined;
    let motion = typeof payload.motion === "string" ? payload.motion.trim() : "";
    let side: DebateSide = payload.side;
    const detail = debateId ? await getPractice(debateId, user.userId) : null;
    if (detail) {
      motion = detail.debate.motion;
      side = detail.debate.side;
      if (detail.score || detail.turns.length >= 6) return Response.json({ error: "This round is complete. Open your feedback." }, { status: 409 });
      if (payload.expectedTurns !== detail.turns.length) return Response.json({ error: "Your practice changed. Reload before sending." }, { status: 409 });
    }
    if (!motion || motion.length > 500 || !["for", "against"].includes(side)) return Response.json({ error: "Choose a topic and side first." }, { status: 400 });
    const reply = await generateBotReply({ motion, side }, argument, detail?.turns ?? []);
    await getOrCreateUser(user);
    const saved = await savePracticeExchange({ userId: user.userId, debateId, motion, side,
      expectedTurns: detail?.turns.length ?? 0, argument, reply });
    return Response.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save your speech. Please try again.";
    return Response.json({ error: message }, { status: error instanceof DebateAIError ? error.status : /not found/i.test(message) ? 404 : /changed|complete/i.test(message) ? 409 : 500 });
  }
}
