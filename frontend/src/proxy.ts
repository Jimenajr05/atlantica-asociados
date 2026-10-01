import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();

  let response = NextResponse.next({ request });
  const redirectToLogin = (error?: string) => {
    const url = new URL('/admin/login', request.url);
    if (error) url.searchParams.set('error', error);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) return redirectToLogin();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return redirectToLogin();
    if (user.email?.toLowerCase() !== 'infoatlantica.asociados@gmail.com') {
      return redirectToLogin('access_denied');
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin') return redirectToLogin('access_denied');
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch {
    return redirectToLogin('auth_failed');
  }
}

export const config = { matcher: ['/admin/:path*'] };
