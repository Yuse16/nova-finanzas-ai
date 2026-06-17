import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Roboto_Mono, Geist, Geist_Mono } from 'next/font/google' // Import Inter and Roboto_Mono
import { UIProvider } from '@/lib/ui-context'
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
  title: 'Nova Finanzas AI',
  description:
    'Tu centro de control financiero personal con inteligencia artificial. Registra gastos por voz, controla tus cuentas y alcanza tus metas.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nova Finanzas',
  },
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' }, // Apuntará al nuevo icono
    { rel: 'icon', url: '/favicon.ico' }, // Apuntará al nuevo icono
  ],
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#4a7fd6',
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
      {/* Añadir style para safe-area-bottom en el body, y el padding-top lo controlará el div en page.tsx */}
      <body className="font-system antialiased" style={{ paddingBottom: 'var(--sab)' }}>
        <UIProvider>
          <AppShell>
            {children}
          </AppShell>
        </UIProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

