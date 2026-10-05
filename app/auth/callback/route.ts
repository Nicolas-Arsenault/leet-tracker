import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!code || !url || !key || !ownerEmail) return NextResponse.redirect(new URL("/login?error=config", request.url));

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Supabase OAuth exchange failed", { code: error.code, message: error.message });
    return NextResponse.redirect(new URL(`/login?error=oauth&code=${encodeURIComponent(error.code ?? "exchange-failed")}`, request.url));
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email?.toLowerCase() !== ownerEmail) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  return NextResponse.redirect(new URL("/", request.url));
}
