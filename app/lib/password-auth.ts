import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { ChatGPTUser } from "../chatgpt-auth";
import { getSupabaseDatabaseClient, isSupabaseDatabaseConfigured } from "./supabase-server";

const scrypt = promisify(scryptCallback);
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;
const LOCAL_ACCOUNT_DOMAIN = "accounts.debatelab.local";

type PasswordUserRow = { id: string; email: string; display_name: string; full_name: string | null; login: string | null; password_hash: string | null };

export function normalizeLogin(value: string) { return value.trim().toLowerCase(); }
export function validateLogin(login: string): string | null {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(login) ? null : "Login must be 3–32 characters: letters, numbers, dot, dash, or underscore.";
}
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  return null;
}

export async function registerPasswordUser({ login, password, displayName }: { login: string; password: string; displayName: string }): Promise<ChatGPTUser> {
  requireDatabase();
  const normalizedLogin = normalizeLogin(login);
  const client = getSupabaseDatabaseClient();
  const { data: existing, error: findError } = await client.from("users").select("id").eq("login", normalizedLogin).maybeSingle();
  if (findError) throw new Error(findError.message);
  if (existing) throw new Error("This login is already taken.");
  const now = new Date().toISOString();
  const { data, error } = await client.from("users").insert({
    id: `account:${crypto.randomUUID()}`,
    email: `${normalizedLogin}@${LOCAL_ACCOUNT_DOMAIN}`,
    display_name: displayName,
    full_name: displayName,
    login: normalizedLogin,
    password_hash: await hashPassword(password),
    created_at: now,
    updated_at: now,
  }).select().single();
  if (error) {
    if (error.code === "23505") throw new Error("This login is already taken.");
    throw new Error(error.message);
  }
  return mapUser(data as PasswordUserRow);
}

export async function authenticatePasswordUser({ login, password }: { login: string; password: string }): Promise<ChatGPTUser | null> {
  requireDatabase();
  const { data, error } = await getSupabaseDatabaseClient().from("users").select("id,email,display_name,full_name,login,password_hash").eq("login", normalizeLogin(login)).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.password_hash || !(await verifyPassword(password, data.password_hash))) return null;
  return mapUser(data as PasswordUserRow);
}

export async function createPasswordSession(userId: string) {
  requireDatabase();
  const id = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000).toISOString();
  const { error } = await getSupabaseDatabaseClient().from("user_sessions").insert({ id, user_id: userId, expires_at: expiresAt });
  if (error) throw new Error(error.message);
  return { id, expiresAt };
}

export async function getPasswordSessionUser(sessionId: string): Promise<ChatGPTUser | null> {
  if (!isSupabaseDatabaseConfigured() || !sessionId) return null;
  const client = getSupabaseDatabaseClient();
  const { data: session, error: sessionError } = await client.from("user_sessions").select("user_id,expires_at").eq("id", sessionId).maybeSingle();
  if (sessionError || !session || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const { data: user, error: userError } = await client.from("users").select("id,email,display_name,full_name,login,password_hash").eq("id", session.user_id).maybeSingle();
  if (userError || !user) return null;
  return mapUser(user as PasswordUserRow);
}

export async function updatePasswordAccount({ userId, currentPassword, newPassword }: { userId: string; currentPassword: string; newPassword: string }) {
  requireDatabase();
  const client = getSupabaseDatabaseClient();
  const { data, error } = await client.from("users").select("password_hash").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.password_hash || !(await verifyPassword(currentPassword, data.password_hash))) throw new Error("Your current password is incorrect.");
  const validationError = validatePassword(newPassword);
  if (validationError) throw new Error(validationError);
  const { error: updateError } = await client.from("users").update({ password_hash: await hashPassword(newPassword), updated_at: new Date().toISOString() }).eq("id", userId);
  if (updateError) throw new Error(updateError.message);
}

export async function updatePasswordAccountName({ userId, fullName }: { userId: string; fullName: string }) {
  requireDatabase();
  const name = fullName.trim();
  if (name.length < 2 || name.length > 80) throw new Error("Enter a name between 2 and 80 characters.");
  const { error } = await getSupabaseDatabaseClient().from("users").update({ display_name: name, full_name: name, updated_at: new Date().toISOString() }).eq("id", userId);
  if (error) throw new Error(error.message);
  return name;
}

function mapUser(row: PasswordUserRow): ChatGPTUser { return { userId: row.id, email: row.email, displayName: row.display_name, fullName: row.full_name || row.display_name }; }
async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}
async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltValue, hashValue] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;
  const derived = (await scrypt(password, Buffer.from(saltValue, "base64url"), 64)) as Buffer;
  const expected = Buffer.from(hashValue, "base64url");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
function requireDatabase() { if (!isSupabaseDatabaseConfigured()) throw new Error("Account storage is not configured."); }
