import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
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
  const { error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error) {
    console.error("Supabase OAuth exchange failed", { code: error.code, message: error.message });
    const failure = new URL("/login", request.url);
    failure.searchParams.set("error", "oauth");
    failure.searchParams.set("code", error.code ?? "exchange-failed");
    failure.searchParams.set("message", error.message);
    return NextResponse.redirect(failure);
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email?.toLowerCase() !== ownerEmail) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  return NextResponse.redirect(new URL("/", request.url));
}
