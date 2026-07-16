"use server";

import { cookies } from "next/headers";

export type PrepareSignupState = { success: boolean; message: string };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CUSTOMER_SIGNUP_COOKIE = "sk_ec_customer_signup";

export async function prepareCustomerSignup(name: string, email: string): Promise<PrepareSignupState> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedName || normalizedName.length > 100) return { success: false, message: "顧客名を入力してください。" };
  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) return { success: false, message: "正しい連絡用メールアドレスを入力してください。" };

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SIGNUP_COOKIE, Buffer.from(JSON.stringify({ name: normalizedName, email: normalizedEmail })).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return { success: true, message: "" };
}
