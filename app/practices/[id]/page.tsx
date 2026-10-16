import { notFound } from "next/navigation";
import { PracticeClient } from "../../PracticeClient";
import { getCurrentUserState } from "../../lib/current-user";
import { getPractice, listPractices } from "../../lib/debate-store";
export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await getCurrentUserState();
  const { id } = await params;
  let detail;
  try { detail = await getPractice(id, user.userId); }
  catch (error) { if (error instanceof Error && /not found/i.test(error.message)) notFound(); throw error; }
  const practices = await listPractices(user.userId);
  const previous = practices.find((item) => item.debate.id !== id && item.debate.createdAt < detail.debate.createdAt && item.score !== null);
  return <PracticeClient key={id} initial={detail} previousScore={previous?.score?.overall ?? null} />;
}
