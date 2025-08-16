import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Clock, DollarSign, Shield, Zap, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  const benefits = [
    { icon: Clock, text: 'Launch in under 30 seconds', color: 'text-green-500' },
    { icon: DollarSign, text: 'Starting at just $5', color: 'text-emerald-500' },
    { icon: Shield, text: 'Enterprise-grade security', color: 'text-blue-500' },
    { icon: CheckCircle, text: 'No technical knowledge required', color: 'text-purple-500' }
  ];

  const urgencyStats = [
    { value: '2,847', label: 'Tokens created this week', icon: Zap },
    { value: '156', label: 'Creators joined today', icon: Users },
    { value: '98.7%', label: 'Success rate', icon: TrendingUp }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Urgency Banner */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 mb-6 rounded-full text-sm font-bold"
               style={{ 
                 background: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)',
                 color: 'rgb(255, 255, 255)',
                 boxShadow: 'rgba(239, 68, 68, 0.4) 0px 8px 20px 0px'
               }}>
            <div className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></div>
            🔥 LIMITED TIME: Free deployment for the next 48 hours
          </div>
          
          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {urgencyStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="w-5 h-5 text-primary mr-2" />
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary font-medium text-sm">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="uppercase tracking-wide">Join The Movement</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Your Token Vision Deserves to Become
                <span className="text-primary"> Reality</span>
              </h2>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Stop waiting for the "perfect moment." 
              <span className="text-foreground font-semibold"> Over 10,000 visionaries</span> have already 
              transformed their concepts into thriving digital economies. Your opportunity is now.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg"
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <benefit.icon className={`w-5 h-5 ${benefit.color} flex-shrink-0`} />
                  <span className="text-muted-foreground font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/create">
                <Button 
                  size="lg" 
                  className="hover:scale-105 hover:shadow-2xl transition-all duration-300 relative group"
                  style={{
                    background: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: 'rgba(239, 68, 68, 0.5) 0px 15px 40px 0px',
                    color: 'rgb(255, 255, 255)',
                    fontWeight: 700,
                    padding: '16px 32px',
                    fontSize: '18px',
                    borderRadius: '12px',
                    minWidth: '220px'
                  }}
                >
                  <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Start Creating Now
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                    FREE
                  </div>
                </Button>
              </Link>
              <Link href="/docs">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="hover:bg-white/5 transition-all duration-300"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    color: 'rgb(254, 254, 235)',
                    fontWeight: 600,
                    padding: '16px 32px',
                    fontSize: '16px',
                    borderRadius: '12px',
                    minWidth: '180px'
                  }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View Examples
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by 10,000+ creators worldwide
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 border-2 border-background flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  +10,000 others
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Success Story */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-4">
                  Success Story
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 mx-auto mb-4 flex items-center justify-center text-primary-foreground font-bold text-xl">
                  CM
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">CommunityToken</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  "Launched our community token in 30 seconds. Now we have 5,000+ holders and growing!"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-foreground">5,000+</div>
                  <div className="text-xs text-muted-foreground">Token Holders</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-foreground">$50K</div>
                  <div className="text-xs text-muted-foreground">Weekly Volume</div>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Launched with Snarbles • 89 days ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}