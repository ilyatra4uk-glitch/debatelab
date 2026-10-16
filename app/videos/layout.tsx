import { redirect } from "next/navigation";
import { getCurrentUserState } from "../lib/current-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isRegistered } = await getCurrentUserState();
  if (!isRegistered) redirect("/login");
  return children;
}
