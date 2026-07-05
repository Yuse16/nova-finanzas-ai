import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('[AUTH CALLBACK] Callback recibido')
  console.log('[AUTH CALLBACK] Code presente:', !!code)
  console.log('[AUTH CALLBACK] Origin:', origin)
  console.log('[AUTH CALLBACK] Next:', next)

  if (code) {
    console.log('[AUTH CALLBACK] Code detectado, intercambiando por sesión...')

    // Crear la respuesta de redirect primero para poder setear cookies en ella
    const redirectUrl = new URL(`${origin}${next}`)
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = request.cookies.getAll()
            console.log('[AUTH CALLBACK] Cookies en request:', cookies.length)
            return cookies
          },
          setAll(cookiesToSet) {
            console.log('[AUTH CALLBACK] Seteando cookies en response:', cookiesToSet.length)
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log('[AUTH CALLBACK] Cookie set:', name, value.substring(0, 20) + '...')
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[AUTH CALLBACK] exchangeCodeForSession ERROR:', error.message)
    } else {
      console.log('[AUTH CALLBACK] exchangeCodeForSession EXITOSO')

      // Verificar que la sesión se creó
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[AUTH CALLBACK] Session después de exchange:', session ? `EXISTE para ${session.user.email}` : 'NO EXISTE')
      console.log('[AUTH CALLBACK] User ID:', session?.user?.id)
    }

    if (!error) {
      console.log('[AUTH CALLBACK] Redirigiendo a /')
      return response
    }
  }

  console.log('[AUTH CALLBACK] Redirigiendo a login por error o falta de code')
  return NextResponse.redirect(`${origin}/auth/login?error=No se pudo confirmar la autenticación`)
}
