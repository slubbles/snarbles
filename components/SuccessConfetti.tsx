'use client';

import React, { useState, useEffect } from 'react';

// Simple confetti effect using CSS animations (no external dependencies)
const ConfettiPiece = ({ 
  delay, 
  duration, 
  color, 
  size = 2 
}: { 
  delay: number; 
  duration: number; 
  color: string;
  size?: number;
}) => (
  <div
    className="absolute rounded"
    style={{
      backgroundColor: color,
      width: `${size}px`,
      height: `${size}px`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}ms`,
      animationDuration: `${duration}ms`,
      animation: `confetti-fall ${duration}ms ease-out ${delay}ms forwards`
    }}
  />
);

interface SuccessConfettiProps {
  show: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

export function SuccessConfetti({ 
  show, 
  duration = 4000, 
  particleCount = 80,
  onComplete 
}: SuccessConfettiProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      
      // Set timer to stop confetti
      const timer = setTimeout(() => {
        setIsActive(false);
        if (onComplete) onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!show || !isActive) return null;

  const confettiColors = [
    'rgb(239, 68, 68)',   // Design system primary
    'rgb(59, 130, 246)',  // Blue
    'rgb(34, 197, 94)',   // Green  
    'rgb(168, 85, 247)',  // Purple
    'rgb(249, 115, 22)',  // Orange
    'rgb(236, 72, 153)',  // Pink
    'rgb(245, 158, 11)',  // Amber
    'rgb(99, 102, 241)'   // Indigo
  ];

  return (
    <>
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg) scale(1);
            opacity: 1;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(360deg) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
        {Array.from({ length: particleCount }).map((_, i) => (
          <ConfettiPiece
            key={i}
            delay={Math.random() * 2000}
            duration={2000 + Math.random() * 2000}
            color={confettiColors[Math.floor(Math.random() * confettiColors.length)]}
            size={2 + Math.random() * 4}
          />
        ))}
      </div>
    </>
  );
}