'use client';

import { LeadGenerationForm } from '@/components/LeadGenerationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Shield, 
  Zap, 
  Star, 
  CheckCircle, 
  TrendingUp, 
  Globe,
  ArrowRight,
  DollarSign,
  Clock,
  Target,
  Award
} from 'lucide-react';

export default function EnterprisePage() {
  return (
    <div className="min-h-screen app-background">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Building2 className="w-3 h-3 mr-1" />
            Enterprise Solutions
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Scale Token Creation
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              {" "}for Enterprise
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            White-label solutions, volume pricing, and custom features for businesses creating tokens at scale. 
            Save 80% on development costs and launch in weeks, not months.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Star className="w-4 h-4 mr-2" />
              Get Custom Pricing
            </Button>
            <Button size="lg" variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">$2M+</div>
              <div className="text-muted-foreground">Platform Value Secured</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">10,000+</div>
              <div className="text-muted-foreground">Tokens Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500 mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">80%</div>
              <div className="text-muted-foreground">Cost Reduction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to scale token creation across your organization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "White-Label Platform",
                description: "Deploy Snarbles under your brand with custom domain, colors, and logo",
                color: "text-blue-500"
              },
              {
                icon: Users,
                title: "Team Management",
                description: "Role-based access, user permissions, and team collaboration tools",
                color: "text-green-500"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "SOC2 compliance, SSO integration, and advanced audit logs",
                color: "text-red-500"
              },
              {
                icon: Zap,
                title: "API Integration",
                description: "RESTful APIs for seamless integration with your existing systems",
                color: "text-yellow-500"
              },
              {
                icon: TrendingUp,
                title: "Advanced Analytics",
                description: "Custom dashboards, detailed reporting, and business intelligence",
                color: "text-purple-500"
              },
              {
                icon: Target,
                title: "SLA Guarantees",
                description: "99.9% uptime, dedicated support, and performance guarantees",
                color: "text-orange-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="glass-card border-border/50 hover:border-border transition-colors">
                <CardHeader>
                  <feature.icon className={`w-8 h-8 ${feature.color} mb-2`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Proven Use Cases
            </h2>
            <p className="text-xl text-muted-foreground">
              See how enterprises are using Snarbles to transform their business
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                title: "DeFi Protocol Launch",
                company: "Fortune 500 Financial Services",
                challenge: "Needed to launch governance token for new DeFi platform",
                solution: "White-label Snarbles deployment with custom branding",
                results: ["Launched in 2 weeks vs 6 months", "Saved $200k in development", "10M+ tokens in circulation"],
                icon: TrendingUp
              },
              {
                title: "Gaming Token Economy",
                company: "AAA Gaming Studio",
                challenge: "Required multiple game tokens with different mechanics",
                solution: "Bulk token creation with custom tokenomics",
                results: ["50+ game tokens created", "Integrated with game APIs", "2M+ active token holders"],
                icon: Star
              },
              {
                title: "Corporate Loyalty Program",
                company: "Global Retail Chain",
                challenge: "Transform traditional points into blockchain tokens",
                solution: "Enterprise API integration with existing systems",
                results: ["100M+ tokens issued", "30% increase in engagement", "Cross-chain compatibility"],
                icon: Award
              },
              {
                title: "DAO Infrastructure",
                company: "Web3 Investment Fund",
                challenge: "Create governance tokens for portfolio companies",
                solution: "Multi-tenant platform with fund management tools",
                results: ["200+ portfolio tokens", "Automated governance setup", "Streamlined investor relations"],
                icon: Building2
              }
            ].map((useCase, index) => (
              <Card key={index} className="glass-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <useCase.icon className="w-6 h-6 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">{useCase.title}</CardTitle>
                      <CardDescription>{useCase.company}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Challenge</h4>
                    <p className="text-sm">{useCase.challenge}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Solution</h4>
                    <p className="text-sm">{useCase.solution}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Results</h4>
                    <ul className="space-y-1">
                      {useCase.results.map((result, i) => (
                        <li key={i} className="flex items-center text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Enterprise Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Transparent pricing that scales with your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Pro",
                price: "$99",
                period: "/month",
                description: "For growing teams",
                features: [
                  "Up to 100 tokens/month",
                  "Advanced analytics",
                  "API access",
                  "Priority support",
                  "Team collaboration"
                ],
                cta: "Start Free Trial"
              },
              {
                name: "Enterprise",
                price: "$499",
                period: "/month",
                description: "For large organizations",
                features: [
                  "Unlimited tokens",
                  "White-label platform",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantees",
                  "Custom features"
                ],
                cta: "Contact Sales",
                popular: true
              },
              {
                name: "Custom",
                price: "Contact us",
                period: "",
                description: "For enterprise needs",
                features: [
                  "Everything in Enterprise",
                  "On-premise deployment",
                  "Custom development",
                  "24/7 dedicated support",
                  "Custom SLAs",
                  "Training & onboarding"
                ],
                cta: "Schedule Call"
              }
            ].map((plan, index) => (
              <Card key={index} className={`glass-card ${plan.popular ? 'border-blue-500/50 ring-1 ring-blue-500/20' : ''}`}>
                {plan.popular && (
                  <div className="text-center py-2 bg-blue-500/10 text-blue-500 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-lg text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Generation Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <LeadGenerationForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Scale Your Token Creation?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join enterprise customers who've saved millions with Snarbles
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <DollarSign className="w-4 h-4 mr-2" />
              Get Enterprise Pricing
            </Button>
            <Button size="lg" variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              Book 30-min Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
