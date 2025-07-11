import { Suspense } from 'react';
import HeroSection from '@/components/sections/HeroSection';
import StatsSection from '@/components/sections/StatsSection';
import FeaturesGrid from '@/components/sections/FeaturesGrid';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';

export default function Home() {
  return (
    <div className="min-h-screen snarbles-background">
      {/* Hero Section */}
      <Suspense fallback={<div className="h-screen bg-gray-900 animate-pulse" />}>
        <HeroSection />
      </Suspense>

      {/* Stats Section */}
      <Suspense fallback={<div className="h-32 bg-gray-800 animate-pulse" />}>
        <StatsSection />
      </Suspense>

      {/* Features Section */}
      <Suspense fallback={<div className="h-96 bg-gray-800 animate-pulse" />}>
        <FeaturesGrid />
      </Suspense>

      {/* Testimonials */}
      <Suspense fallback={<div className="h-64 bg-gray-800 animate-pulse" />}>
        <TestimonialsSection />
      </Suspense>

      {/* FAQ Section */}
      <Suspense fallback={<div className="h-96 bg-gray-800 animate-pulse" />}>
        <FAQSection />
      </Suspense>
    </div>
  );
}