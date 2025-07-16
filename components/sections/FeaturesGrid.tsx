"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Zap, Users, Globe, Code, Rocket } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Secure & Audited",
    description: "Built with enterprise-grade security and undergoes regular audits",
    badge: "Security",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Deploy tokens in seconds, not hours. Optimized for speed",
    badge: "Performance",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by developers, for developers. Open source and transparent",
    badge: "Community",
    color: "from-blue-500 to-purple-500"
  },
  {
    icon: Globe,
    title: "Multi-Chain",
    description: "Support for multiple blockchain networks in one platform",
    badge: "Cross-Chain",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description: "Clean APIs, comprehensive docs, and excellent developer experience",
    badge: "DX",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: Rocket,
    title: "Production Ready",
    description: "Battle-tested infrastructure used by thousands of projects",
    badge: "Reliability",
    color: "from-red-500 to-rose-500"
  }
]

export default function FeaturesGrid() {
  return (
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Launch
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools and features to create, deploy, and manage your tokens with confidence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Explore All Features
          </Button>
        </div>
      </div>
    </section>
  )
}
