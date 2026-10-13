import { cookies } from "next/headers";
import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";

const REGISTERED_USER_COOKIE = "debateLabUser";

const GUEST_USER: ChatGPTUser = {
  userId: "guest-user",
  displayName: "Guest debater",
  email: "guest@debate.lab",
  fullName: "Guest debater",
};

export async function getCurrentUser(): Promise<ChatGPTUser> {
  return (await getChatGPTUser()) ?? (await getRegisteredUser()) ?? GUEST_USER;
}

export async function getCurrentUserState(): Promise<{
  isRegistered: boolean;
  user: ChatGPTUser;
}> {
  const chatGPTUser = await getChatGPTUser();
  if (chatGPTUser) {
    return { isRegistered: true, user: chatGPTUser };
  }

  const registeredUser = await getRegisteredUser();
  if (registeredUser) {
    return { isRegistered: true, user: registeredUser };
  }

  return { isRegistered: false, user: GUEST_USER };
}

export function encodeRegisteredUser(user: ChatGPTUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

export function registeredUserCookieName() {
  return REGISTERED_USER_COOKIE;
}

async function getRegisteredUser(): Promise<ChatGPTUser | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(REGISTERED_USER_COOKIE)?.value;
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<ChatGPTUser>;
    const displayName = parsed.displayName?.trim();
    const email = parsed.email?.trim();
    const userId = parsed.userId?.trim();

    if (!displayName || !email || !userId) return null;

    return {
      userId,
      displayName,
      email,
      fullName: parsed.fullName?.trim() || displayName,
    };
  } catch {
    return null;
  }
}
