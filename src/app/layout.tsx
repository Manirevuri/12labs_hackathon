import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Memv - Find Any Moment in Your Videos',
  description: 'Search and extract specific moments from your video library instantly',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950`}>
          <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/60 backdrop-blur-xl border-b border-gray-800/50 shadow-sm">
            <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto">
              <div className="flex items-center gap-6">
                <a href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <span className="font-bold text-xl text-white">
                    Memv
                  </span>
                </a>
                
                <nav className="hidden md:flex items-center gap-6">
                 <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors font-medium text-sm">
                    Dashboard
                  </a>
                 <a href="/indexes" className="text-gray-300 hover:text-white transition-colors font-medium text-sm">
                    Indexes
                  </a>
                  <a href="/upload" className="text-gray-300 hover:text-white transition-colors font-medium text-sm">
                    Upload
                  </a>
                  <a href="/search" className="text-gray-300 hover:text-white transition-colors font-medium text-sm">
                    Search
                  </a>
                  
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-gray-300 hover:text-white transition-all font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-800/50">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-full font-medium text-sm px-5 py-2 hover:shadow-lg transition-all hover:scale-105">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </header>
          <main className="pt-16">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}