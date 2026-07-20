import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { withBasePath } from "@/config/site";
import { isAdminUser } from "@/lib/auth/authorization";

export async function updateSupabaseSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-sk-admin-login");
  const isAdminLogin = request.nextUrl.pathname.endsWith("/admin/login");
  if (isAdminLogin) {
    requestHeaders.set("x-sk-admin-login", "1");
  }
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return NextResponse.redirect(new URL(`${withBasePath("/admin/login")}?error=configuration`, request.url));
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (isAdminLogin) {
    if (authError?.code === "refresh_token_not_found") {
      console.info("失効した管理者ログインセッションを削除しました。");
    }
    return response;
  }
  if (!user || !isAdminUser(user)) {
    const loginUrl = new URL(withBasePath("/admin/login"), request.url);
    if (user) loginUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
