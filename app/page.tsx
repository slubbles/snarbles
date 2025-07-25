import { Suspense } from "react"
import HeroSection from "@/components/sections/HeroSection"
import StatsSection from "@/components/sections/StatsSection"
import FeaturesGrid from "@/components/sections/FeaturesGrid"
import TestimonialsSection from "@/components/TestimonialsSection"
import FAQSection from "@/components/FAQSection"
import WalletAwareHowItWorksSection from "@/components/WalletAwareHowItWorksSection"
import CTASection from "@/components/CTASection"
import MultiChainSection from "@/components/sections/MultiChainSection"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Suspense fallback={<div className="h-screen bg-background animate-pulse" />}>
        <HeroSection />
      </Suspense>

      {/* Stats Section */}
      <Suspense fallback={<div className="h-32 bg-background animate-pulse" />}>
        <StatsSection />
      </Suspense>

      {/* Multi-Chain Support Section */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <MultiChainSection />
      </Suspense>

      {/* Features Section */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <FeaturesGrid />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<div className="h-64 bg-background animate-pulse" />}>
        <CTASection />
      </Suspense>

      {/* How It Works */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <WalletAwareHowItWorksSection />
      </Suspense>

      {/* Testimonials */}
      <Suspense fallback={<div className="h-64 bg-background animate-pulse" />}>
        <TestimonialsSection />
      </Suspense>

      {/* FAQ Section */}
      <Suspense fallback={<div className="h-96 bg-background animate-pulse" />}>
        <FAQSection />
      </Suspense>
    </div>
  );
}