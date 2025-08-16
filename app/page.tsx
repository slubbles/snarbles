import { Suspense } from "react"
import HeroSection from "@/components/sections/HeroSection"
import LiveActivityFeed from "@/components/sections/LiveActivityFeed"
import StatsSection from "@/components/sections/StatsSection"
import InlineTokenCreator from "@/components/sections/InlineTokenCreator"
import FeaturesGrid from "@/components/sections/FeaturesGrid"
import TestimonialsSection from "@/components/TestimonialsSection"
import CTASection from "@/components/CTASection"
import MultiChainSection from "@/components/sections/MultiChainSection"
import WalletAwareHowItWorksSection from "@/components/WalletAwareHowItWorksSection"
import FAQSection from "@/components/FAQSection"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Enhanced with urgency */}
      <Suspense fallback={<div className="h-screen bg-background animate-pulse" />}>
        <HeroSection />
      </Suspense>

      {/* NEW: Live Activity Feed - Social proof and FOMO */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <LiveActivityFeed />
      </Suspense>

      {/* Stats Section - Enhanced with live counters */}
      <Suspense fallback={<div className="h-32 bg-background animate-pulse" />}>
        <StatsSection />
      </Suspense>

      {/* NEW: Inline Token Creator - Interactive demo */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <InlineTokenCreator />
      </Suspense>

      {/* Features Section - Condensed */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <FeaturesGrid />
      </Suspense>

      {/* Testimonials - Social proof */}
      <Suspense fallback={<div className="h-64 bg-background animate-pulse" />}>
        <TestimonialsSection />
      </Suspense>

      {/* Enhanced CTA Section - Multiple conversion paths */}
      <Suspense fallback={<div className="h-64 bg-background animate-pulse" />}>
        <CTASection />
      </Suspense>

      {/* Multi-Chain Support */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <MultiChainSection />
      </Suspense>

      {/* How It Works */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <WalletAwareHowItWorksSection />
      </Suspense>

      {/* FAQ Section */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <FAQSection />
      </Suspense>
    </div>
  );
}