"use server";

import { cookies } from "next/headers";

const STAY_SIGNUP_COOKIE = "sk_ec_stay_signup";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function prepareStaySignup(name: string, email: string) {
  const normalizedName = name.trim(); const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedName || normalizedName.length > 100) return { success: false, message: "顧客名を入力してください。" };
  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) return { success: false, message: "正しいメールアドレスを入力してください。" };
  const cookieStore = await cookies();
  cookieStore.set(STAY_SIGNUP_COOKIE, Buffer.from(JSON.stringify({ name: normalizedName, email: normalizedEmail })).toString("base64url"), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 10 * 60 });
  return { success: true, message: "" };
}
