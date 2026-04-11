import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'realreturn.in — See What Your Investment Actually Earns',
  description: 'Calculate real returns after tax and inflation. Compare FD, RD and Mutual Funds side by side. Free, no login required.',
  keywords: 'FD calculator, SIP calculator, real return, inflation adjusted return, India investment calculator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}