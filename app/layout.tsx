import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Roboto_Mono, Geist, Geist_Mono } from 'next/font/google' // Import Inter and Roboto_Mono
import { UIProvider } from '@/lib/ui-context'
import { AuthProvider } from '@/context/auth-context'
import { AppShell } from '@/components/app-shell'
import './globals.css'
// useStore cannot be imported here as this is a Server Component

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Initialize Inter and Roboto_Mono fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export const metadata: Metadata = {
  title: 'MPUME Finanzas',
  description:
    'Tu centro de control financiero personal con inteligencia artificial. Registra gastos por voz, controla tus cuentas y alcanza tus metas.',
  generator: 'v0.app',
  manifest: '/manifest.json?v=4',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MPUME Finanzas',
  },
  icons: [
    { rel: 'icon', url: '/icon-192.webp?v=1', type: 'image/webp', sizes: '192x192' },
    { rel: 'apple-touch-icon', url: '/icon-512.webp?v=1', type: 'image/webp', sizes: '512x512' },
    { rel: 'shortcut icon', url: '/icon-192.webp?v=1', type: 'image/webp' },
  ],
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'MPUME Finanzas',
    description: 'Tu centro de control financiero personal con inteligencia artificial.',
    images: [{ url: '/icon-512.webp?v=1', width: 512, height: 512 }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // CRUCIAL para que safe-area-inset-* funcione
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // NOTE: Next.js Layouts are Server Components by default. We cannot directly use
  // `useStore` here. The font selection needs to be applied client-side.
  // A common pattern is to wrap the body with a client component that reads the store
  // and applies the class. For now, we'll ensure all font variables are loaded
  // and apply a default class. The actual dynamic application should be handled
  // by a client-side component or CSS variables set on the body by JS.

  const fontClasses = `${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto_mono.variable}`

  return (
    // Aplicar las clases de fuente generadas directamente al html
    <html lang="es" className={fontClasses}>
      <body className="font-system antialiased bg-gray-50 dark:bg-gray-950">
        <AuthProvider>
          <UIProvider>
            <AppShell>
              {children}
            </AppShell>
          </UIProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

