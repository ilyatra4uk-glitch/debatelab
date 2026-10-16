import { getCurrentUserState } from "@/app/lib/current-user";
import {
  addDebateTurn,
  createBotDebate,
  getOrCreateUser,
} from "@/app/lib/debate-store";
import { DebateAIError, generateBotReply } from "@/app/lib/debate-ai";
import type { DebateSide } from "@/app/lib/debate-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      motion?: string;
      side?: DebateSide;
      argument?: string;
    };
    const motion = payload.motion?.trim() ?? "";
    const side = payload.side;
    const argument = payload.argument?.trim() ?? "";

    if (!motion) {
      return Response.json({ error: "Choose a motion first." }, { status: 400 });
    }
    if (side !== "for" && side !== "against") {
      return Response.json({ error: "Choose your side." }, { status: 400 });
    }
    if (argument.length < 20) {
      return Response.json(
        { error: "Write a fuller opening argument before starting." },
        { status: 400 },
      );
    }

    const { isRegistered, user: authUser } = await getCurrentUserState();
    if (!isRegistered) {
      return Response.json(
        { error: "Create a profile before saving a debate." },
        { status: 401 },
      );
    }

    const user = await getOrCreateUser(authUser);
    const botReply = await generateBotReply({ motion, side }, argument);
    const debate = await createBotDebate({
      userId: user.userId,
      motion,
      side,
    });
    const userTurn = await addDebateTurn({
      debateId: debate.id,
      speaker: "user",
      content: argument,
    });
    const botTurn = await addDebateTurn({
      debateId: debate.id,
      speaker: "bot",
      content: botReply,
    });

    return Response.json({
      debate,
      turns: [userTurn, botTurn],
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: error instanceof DebateAIError ? error.status : 500 },
    );
  }
}
