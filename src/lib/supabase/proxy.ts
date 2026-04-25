import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT use getSession() here — it reads from storage
  // and doesn't validate the JWT. Use getClaims() instead.
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except for auth routes & static assets)
  if (!user) {
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
    const isAuthRoute = request.nextUrl.pathname === '/' ||
                        request.nextUrl.pathname.startsWith('/login') || 
                        request.nextUrl.pathname.startsWith('/api/auth');
    const isDatabaseRoute = request.nextUrl.pathname.startsWith('/api/db');

    if (!isAuthRoute && !isDatabaseRoute) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
