import { Search, Film, Sparkles, Upload, Brain, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-100/50 to-transparent dark:from-gray-900/50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-gray-200/30 to-gray-300/30 dark:from-gray-800/30 dark:to-gray-700/30 rounded-full blur-3xl" />
        </div>
        
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-full px-4 py-2 text-sm leading-6 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all">
              Powered by AI video understanding
              <span className="ml-2 inline-flex items-center">
                <Sparkles className="h-3 w-3" />
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Find{' '}
            <span className="bg-gradient-to-r from-gray-600 via-gray-800 to-gray-600 bg-clip-text text-transparent">
              any moment
            </span>{' '}
            in your videos instantly
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Stop spending hours manually searching through video content. Memv uses advanced AI to index, 
            search, and extract specific moments from your entire video library in seconds.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-3 text-sm font-medium text-white hover:from-gray-800 hover:to-black focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all hover:shadow-lg"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            
            {/* Search Moments Card */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-800/80 dark:to-gray-800/40 backdrop-blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 to-transparent dark:from-gray-700/20" />
              <div className="relative p-8 ring-1 ring-gray-200/50 dark:ring-gray-700/50 rounded-2xl">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-gray-200/40 to-gray-300/40 dark:from-gray-700/40 dark:to-gray-600/40 blur-3xl" />
                
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-xl mb-4">
                    <Search className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Search for Any Moment
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Describe what you&apos;re looking for in natural language and instantly find exact moments 
                    across your entire video index. No more manual scrubbing through hours of content.
                  </p>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder='Try "emotional reunion scene" or "product close-up"'
                      className="w-full rounded-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
                      disabled
                    />
                    
                    <Link
                      href="/search"
                      className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3 text-sm font-medium text-white hover:from-gray-800 hover:to-black focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all hover:shadow-lg"
                    >
                      Go to Search Page
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Extract Moments Card */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-800/80 dark:to-gray-800/40 backdrop-blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 to-transparent dark:from-gray-700/20" />
              <div className="relative p-8 ring-1 ring-gray-200/50 dark:ring-gray-700/50 rounded-2xl">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-gray-300/40 to-gray-400/40 dark:from-gray-600/40 dark:to-gray-500/40 blur-3xl" />
                
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 text-white shadow-xl mb-4">
                    <Film className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Extract Specific Moments
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Automatically identify and extract key moments from all videos in your collection. 
                    Get clips of specific scenes, emotions, or brand moments across multiple videos at once.
                  </p>
                  
                  <div className="space-y-3">
                    <select 
                      className="w-full rounded-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
                      disabled
                    >
                      <option>Select moment type...</option>
                      <option>Emotional Moments</option>
                      <option>Action Scenes</option>
                      <option>Dialogue/Speech</option>
                      <option>Brand/Logo Mentions</option>
                      <option>Music/Musical Performances</option>
                      <option>Landscape/Nature</option>
                    </select>
                    
                    <Link
                      href="/extract"
                      className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-gray-600 to-gray-800 px-4 py-3 text-sm font-medium text-white hover:from-gray-700 hover:to-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all hover:shadow-lg"
                    >
                      Go to Extract Page
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-950/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-gray-200/20 to-gray-300/20 dark:from-gray-800/20 dark:to-gray-700/20 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Three simple steps to unlock your video content
            </p>
          </div>

          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-lg group-hover:shadow-xl transition-all">
                  <Upload className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
                  1. Upload Videos
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Upload your video library or connect to your existing storage
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-lg group-hover:shadow-xl transition-all">
                  <Brain className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
                  2. AI Processing
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Our AI analyzes and indexes every frame, scene, and moment
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-lg group-hover:shadow-xl transition-all">
                  <Download className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
                  3. Find & Extract
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Search and extract specific moments instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-100/50 to-transparent dark:from-gray-900/50" />
        <div className="relative bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-md flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  © 2025 Memv. All rights reserved.
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Built for creative teams who value their time
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}