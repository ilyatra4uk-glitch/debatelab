import { redirect } from "next/navigation";
import { getCurrentUserState } from "../lib/current-user";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function PracticesLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUserState()).isRegistered) redirect("/login");
  return children;
}
