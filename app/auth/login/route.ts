import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }

  const cookieResponse = NextResponse.next();
  const supabase = createServerClient(url, key, {
    auth: {
      experimental: { appendPkceFlowIdToRedirects: true },
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => cookieResponse.cookies.set(name, value, options));
      },
    },
  });

  const callbackUrl = new URL("/auth/callback", request.url);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    console.error("Supabase OAuth start failed", error);
    return NextResponse.redirect(new URL("/login?error=oauth-start", request.url));
  }

  const redirect = NextResponse.redirect(data.url);
  cookieResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
