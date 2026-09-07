import './styles/globals.css'
import { ReactNode } from 'react'
import Header from '../components/Header'
import MobileBottomNav from '../components/MobileBottomNav'

export const metadata = {
  title: 'সহজ কাজ',
  description: 'Bengali photo & document toolkit'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body>
        <Header />
        <main className="max-w-3xl mx-auto px-4 pb-28">
          {children}
        </main>
        <MobileBottomNav />
      </body>
    </html>
  )
}
