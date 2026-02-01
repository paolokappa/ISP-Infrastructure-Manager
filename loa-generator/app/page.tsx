'use client'

import LoaForm from './components/LoaForm'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Animated gradient background overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ top: '64px' }}>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-700/20 to-transparent animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
        {/* Decorative circles */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-72 h-72 bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-6000"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 pt-8 pb-8">
        <div className="container mx-auto px-4">
          {/* Header with logo */}
          <div className="flex justify-center items-center mb-6 animate-fadeIn">
            <div className="w-[200px] h-[80px] relative">
              <Image 
                src="/images/company-logo.png" 
                alt="Your Company Name" 
                fill
                className="object-contain drop-shadow-xl"
                priority
                sizes="200px"
              />
            </div>
          </div>
          
          {/* Title section */}
          <div className="text-center mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                ISP Infrastructure Manager
              </span>
            </h1>
            <h2 className="text-2xl font-semibold mb-4 text-cyan-200">
              🔌 Port Management & LoA Generation Suite
            </h2>
            <div className="flex justify-center items-center gap-2 mb-4">
              <p className="text-xl font-semibold text-white">
                Your Company Name - Professional Network Operations Platform
              </p>
            </div>
          </div>
          
          {/* Form */}
          <div className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <LoaForm />
          </div>
          
          {/* Footer */}
          <footer className="mt-16 text-center animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mx-auto max-w-2xl shadow-lg">
              <div className="flex justify-center items-center gap-4 mb-3">
                <span className="text-lg">📍</span>
                <p className="text-gray-700">
                  Your Street Address, 00000 Your City, Switzerland
                </p>
              </div>
              <div className="flex justify-center items-center gap-6 text-gray-600">
                <span className="flex items-center gap-1">
                  📞 +00 00 000 00 00
                </span>
                <span className="flex items-center gap-1">
                  📧 soc@example.com
                </span>
                <span className="flex items-center gap-1">
                  🌍 AS00000
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                © 2026 Your Company Name - All rights reserved
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}