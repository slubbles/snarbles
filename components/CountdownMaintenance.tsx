'use client'

import { useState, useEffect } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function CountdownMaintenance() {
  // Target date: 30 days from October 1, 2025
  const targetDate = new Date('2025-10-31T00:00:00Z')
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)

  function calculateTimeLeft(): TimeLeft | null {
    const difference = +targetDate - +new Date()
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }
    return null
  }

  useEffect(() => {
    setMounted(true)
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#ff3131] flex items-center justify-center">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap');
      `}</style>
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4 md:p-6" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        
        {/* Logo */}
        <div className="mb-4 md:mb-6 text-center">
          <div className="flex items-center justify-center gap-3 md:gap-5 mb-3">
            <img 
              src="/snrb-logo (1).png" 
              alt="Snarbles Logo" 
              className="h-16 w-16 md:h-28 md:w-28 lg:h-32 lg:w-32 object-contain"
            />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight drop-shadow-2xl">
              Snarbles
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-[2px] w-12 bg-white/30 rounded-full"></div>
            <div className="w-2 h-2 rounded-full bg-white/50"></div>
            <div className="h-[2px] w-12 bg-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Main GIF Area - Bigger */}
        <div className="mb-6 md:mb-8 relative">
          <div className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full flex items-center justify-center overflow-hidden">
            <img 
              src="/loading-gif-2.gif" 
              alt="Snarbles V2 Coming Soon"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        {/* Countdown Timer */}
        {timeLeft ? (
          <div className="w-full max-w-4xl px-4 mb-6 md:mb-8">
            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <TimeUnit value={timeLeft.days} label="Days" />
              <TimeUnit value={timeLeft.hours} label="Hours" />
              <TimeUnit value={timeLeft.minutes} label="Minutes" />
              <TimeUnit value={timeLeft.seconds} label="Seconds" />
            </div>
          </div>
        ) : (
          <div className="text-white text-2xl md:text-3xl font-bold animate-pulse mb-6 md:mb-8">
            🎉 Launch Time! 🎉
          </div>
        )}

        {/* Announcement - Below Timer */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
            V2 is Coming
          </h2>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg md:rounded-xl p-2 sm:p-3 md:p-5 border border-white/10 shadow-lg">
      <div className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white tabular-nums mb-1">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest text-white/70 font-bold">
        {label}
      </div>
    </div>
  )
}
