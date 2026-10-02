'use client';

import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setAllowed(false);
    if (pathname === '/admin/login' || pathname === '/admin/login/') return;
    const client = createClient();
    const verify = async () => {
      try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error || !user) { if (!cancelled) router.replace('/admin/login'); return; }
        const { data: profile, error: roleError } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (cancelled) return;
        if (roleError || profile?.role !== 'admin' || user.email?.toLowerCase() !== 'infoatlantica.asociados@gmail.com') {
          router.replace('/admin/login?error=access_denied');
          return;
        }
        setAllowed(true);
      } catch { if (!cancelled) router.replace('/admin/login?error=auth_failed'); }
    };
    void verify();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!session && !cancelled) { setAllowed(false); router.replace('/admin/login'); }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [pathname, router]);
  if (pathname === '/admin/login' || pathname === '/admin/login/') return <>{children}</>;
  return allowed ? <>{children}</> : <p role="status" className="p-8 text-center">Verificando acceso…</p>;
}
