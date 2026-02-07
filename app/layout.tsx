import './globals.css'
export const metadata = { title: 'SB LX Squares Live', viewport: 'width=device-width, initial-scale=1, maximum-scale=1' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
