import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/unauthorized", "/auth/callback"];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const isVercel = Boolean(process.env.VERCEL);

  if (!url || !key || !ownerEmail) {
    if (isVercel) return new NextResponse("Private access is not configured.", { status: 503 });
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (user.email?.toLowerCase() !== ownerEmail) return NextResponse.redirect(new URL("/unauthorized", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"] };
