import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Obtener sesión del usuario
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.pathname;

  // Si no hay sesión y está intentando entrar a rutas protegidas
  if (!session && (url.startsWith('/admin') || url.startsWith('/medico') || url.startsWith('/paciente'))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si hay sesión, obtener el perfil del usuario
  const userId = session?.user?.id;

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approved, status')
      .eq('id', userId)
      .single();

    // Si por alguna razón no tiene perfil → logout + redirect
    if (!profile) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Bloquear acceso según rol
    if (profile.role === 'paciente' && (url.startsWith('/admin') || url.startsWith('/medico'))) {
      return NextResponse.redirect(new URL('/paciente', req.url));
    }

    if (profile.role === 'medico') {
      // médico no aprobado → bloquear todo menos /medico/pending
      if (!profile.approved && !url.startsWith('/medico/pending')) {
        return NextResponse.redirect(new URL('/medico/pending', req.url));
      }

      if (url.startsWith('/admin') || url.startsWith('/paciente')) {
        return NextResponse.redirect(new URL('/medico', req.url));
      }
    }

    if (profile.role === 'admin') {
      if (url.startsWith('/medico') || url.startsWith('/paciente')) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }
  }

  return res;
}

// Aplicar middleware solo a estas rutas:
export const config = {
  matcher: ['/admin/:path*', '/medico/:path*', '/paciente/:path*'],
};
