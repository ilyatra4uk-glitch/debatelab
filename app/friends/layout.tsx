import { redirect } from "next/navigation";
import { getCurrentUserState } from "../lib/current-user";

export default async function FriendsLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUserState()).isRegistered) redirect("/login");
  return children;
}
