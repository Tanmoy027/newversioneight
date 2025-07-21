'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/lib/supabase-provider'
import { CartProvider } from '@/lib/cart-context'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <CartProvider>
            {!isAdminRoute && <Header />}
            <main>{children}</main>
            {!isAdminRoute && <Footer />}
            <Toaster />
          </CartProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}