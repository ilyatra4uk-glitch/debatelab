import { cookies } from "next/headers";
import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";
import { getPasswordSessionUser } from "./password-auth";

const REGISTERED_USER_COOKIE = "debateLabSession";
const GUEST_USER: ChatGPTUser = { userId: "guest-user", displayName: "Guest debater", email: "guest@debate.lab", fullName: "Guest debater" };

export async function getCurrentUser(): Promise<ChatGPTUser> { return (await getChatGPTUser()) ?? (await getRegisteredUser()) ?? GUEST_USER; }
export async function getCurrentUserState(): Promise<{ isRegistered: boolean; user: ChatGPTUser }> {
  const chatGPTUser = await getChatGPTUser();
  if (chatGPTUser) return { isRegistered: true, user: chatGPTUser };
  const registeredUser = await getRegisteredUser();
  if (registeredUser) return { isRegistered: true, user: registeredUser };
  return { isRegistered: false, user: GUEST_USER };
}
export function registeredUserCookieName() { return REGISTERED_USER_COOKIE; }
// Kept while old one-time-link routes remain deployed. Password login never uses it.
export function encodeRegisteredUser(user: ChatGPTUser) { return Buffer.from(JSON.stringify(user), "utf8").toString("base64url"); }
async function getRegisteredUser(): Promise<ChatGPTUser | null> {
  const cookieStore = await cookies();
  return getPasswordSessionUser(cookieStore.get(REGISTERED_USER_COOKIE)?.value ?? "");
}
