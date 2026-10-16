import { redirect } from "next/navigation";
import { getCurrentUserState } from "../lib/current-user";

export default async function PracticeLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUserState()).isRegistered) redirect("/login");
  return children;
}
