import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "staff";

function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getUserRole(user: Pick<User, "email">): AppRole | null {
  const email = user.email?.toLowerCase();
  if (!email) return null;
  return adminEmails().has(email) ? "admin" : null;
}

export function isAdminUser(user: Pick<User, "email">) {
  return getUserRole(user) === "admin";
}

export function getGoogleAccountName(user: User) {
  const metadata = user.user_metadata;
  return metadata.full_name ?? metadata.name ?? user.email ?? "Googleアカウント";
}
