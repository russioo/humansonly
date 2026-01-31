import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HumansOnly.fun - A Social Network for Real Humans',
  description: 'The internet\'s only AI-free zone. Share your weird thoughts, bad drawings, and gloriously imperfect opinions with other verified humans.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="gradient-bg min-h-screen">
        {children}
      </body>
    </html>
  )
}
