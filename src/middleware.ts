import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // FORT KNOX (Capa B): una cuenta de demo vencida no puede pedir data ni
  // forzar rutas. Se valida en el servidor, en cada request.
  if (user) {
    const path = request.nextUrl.pathname;
    const exempt = path === "/" || path.startsWith("/expirado") || path.startsWith("/bienvenida");
    if (!exempt) {
      const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", user.id).maybeSingle();
      if (!profile?.is_owner) {
        const { data: demo } = await supabase.from("demo_accounts").select("active, expires_at").eq("user_id", user.id).maybeSingle();
        if (demo && (demo.active === false || (demo.expires_at && new Date(demo.expires_at).getTime() <= Date.now()))) {
          const redirect = request.nextUrl.clone();
          redirect.pathname = "/expirado";
          return NextResponse.redirect(redirect);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
