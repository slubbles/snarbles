import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Globe, Shield, Code, Users, Clock, Rocket, Heart, Sparkles, Crown, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-blue-500/12 to-blue-600/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-500/8 to-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-3 snarbles-glass-subtle px-8 py-4 mb-8 rounded-xl">
            <Crown className="w-5 h-5 text-primary animate-pulse" />
            <span className="uppercase tracking-wider text-primary font-bold text-sm">About Snarbles</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Building the Future of
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> Token Creation</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're democratizing blockchain technology—one token at a time.
          </p>
        </div>
        
        {/* Enhanced Our Mission */}
        <div className="snarbles-card-premium p-8 mb-16 border-primary/20 snarbles-glow-blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 snarbles-glass-subtle px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-bold text-sm">Our Mission</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground">Democratizing Token Creation</h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe that creating and managing tokens should be accessible to everyone—not just 
                developers or those with technical expertise. By removing barriers to entry, we're 
                empowering a new wave of creators, communities, and businesses to participate fully 
                in the blockchain economy.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-3 mt-1"><Check className="w-5 h-5 text-green-400" /></div>
                  <p className="snarbles-body">Making blockchain technology accessible to everyone</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 mt-1"><Check className="w-5 h-5 text-green-400" /></div>
                  <p className="snarbles-body">Empowering communities to create their own economies</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 mt-1"><Check className="w-5 h-5 text-green-400" /></div>
                  <p className="snarbles-body">Simplifying complex blockchain operations</p>
                </div>
              </div>
            </div>
            
            <div className="snarbles-glass-subtle p-8 rounded-xl snarbles-border-glow">
              <h3 className="snarbles-subheading text-xl mb-6">Why We Started Snarbles</h3>
              <div className="space-y-4 snarbles-body">
                <p>
                  In 2023, our founding team saw that despite the explosion in blockchain adoption, creating tokens remained a complex, technical, and often expensive process.
                </p>
                <p>
                  Communities and creators with brilliant ideas were being held back by technical barriers, while developers were charging thousands for basic token deployments.
                </p>
                <p>
                  We built Snarbles to solve this problem, making token creation as simple as creating a social media account—but with the full power of blockchain technology.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Our Values */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 snarbles-glass-subtle px-6 py-3 snarbles-border-glow mb-6">
              <Shield className="w-5 h-5 text-blue-400 snarbles-animate-pulse" />
              <span className="uppercase tracking-wider text-blue-400 font-bold text-sm">Core Values</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full snarbles-animate-pulse"></div>
            </div>
            <h2 className="snarbles-subheading text-3xl mb-4">The Principles That Guide Us</h2>
            <p className="snarbles-body max-w-2xl mx-auto">
              Everything we do is guided by these fundamental beliefs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="snarbles-card-premium p-6 snarbles-glow-green hover:border-green-500/40 transition-all duration-500 group">
              <div className="w-12 h-12 rounded-xl snarbles-gradient-green flex items-center justify-center mb-6 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="snarbles-subheading text-xl mb-3">Security First</h3>
              <p className="snarbles-body mb-6">
                We never compromise on security and prioritize protecting user assets above all else
              </p>
              <ul className="space-y-3 snarbles-body text-sm">
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>Rigorous smart contract testing</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>Regular security audits</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>Decentralized architecture</span>
                </li>
              </ul>
            </div>
            
            <div className="snarbles-card-premium p-6 snarbles-glow-blue hover:border-blue-500/40 transition-all duration-500 group">
              <div className="w-12 h-12 rounded-xl snarbles-gradient-blue flex items-center justify-center mb-6 transition-transform">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="snarbles-subheading text-xl mb-3">Radical Simplicity</h3>
              <p className="snarbles-body mb-6">
                We believe powerful technology should be simple to use and accessible to everyone
              </p>
              <ul className="space-y-3 snarbles-body text-sm">
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>No-code interface for complex operations</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>Clear, jargon-free guidance</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>Instant deployment without technical knowledge</span>
                </li>
              </ul>
            </div>
            
            <div className="snarbles-card-premium p-6 snarbles-glow-purple hover:border-purple-500/40 transition-all duration-500 group">
              <div className="w-12 h-12 rounded-xl snarbles-gradient-purple flex items-center justify-center mb-6 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="snarbles-subheading text-xl mb-3">Community Focused</h3>
              <p className="snarbles-body mb-6">
                We build for and with our community, ensuring their needs drive our roadmap
              </p>
              <ul className="space-y-3 snarbles-body text-sm">
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>Community-driven feature prioritization</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>Open feedback channels</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-400" /></div>
                  <span>Regular community events and education</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Enhanced Our Technology */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 snarbles-glass-subtle px-6 py-3 snarbles-border-glow mb-6">
              <Zap className="w-5 h-5 text-purple-400 snarbles-animate-pulse" />
              <span className="uppercase tracking-wider text-purple-400 font-bold text-sm">Technology</span>
              <div className="w-2 h-2 bg-purple-400 rounded-full snarbles-animate-pulse"></div>
            </div>
            <h2 className="snarbles-subheading text-3xl mb-4">Cutting-Edge Infrastructure</h2>
            <p className="snarbles-body max-w-2xl mx-auto">
              Powered by the most advanced blockchain solutions
            </p>
          </div>
          
          <div className="snarbles-card-premium p-8 snarbles-glow-blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="snarbles-subheading text-2xl">Multi-Chain Architecture</h3>
                <p className="snarbles-body leading-relaxed">
                  Our platform is built on a flexible multi-chain foundation that currently supports Solana and Algorand, 
                  with more blockchains coming soon. This allows creators to choose the network that best suits their 
                  project's needs—whether it's Solana's speed, Algorand's low costs, or our upcoming SOON Network integration.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="flex items-center space-x-3 p-4 snarbles-glass-subtle rounded-lg">
                    <div className="w-10 h-10 rounded-lg snarbles-gradient-blue flex items-center justify-center">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                      <p className="snarbles-subheading text-sm">Solana</p>
                      <p className="text-xs snarbles-body">High-speed, low fees</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 snarbles-glass-subtle rounded-lg">
                    <div className="w-10 h-10 rounded-lg snarbles-gradient-green flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                      <p className="snarbles-subheading text-sm">Algorand</p>
                      <p className="text-xs snarbles-body">Carbon-negative, secure</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 snarbles-glass-subtle rounded-lg">
                    <div className="w-10 h-10 rounded-lg snarbles-gradient-orange flex items-center justify-center">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                      <p className="snarbles-subheading text-sm">SOON Network</p>
                      <p className="text-xs snarbles-body">Coming Q3 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 snarbles-glass-subtle rounded-lg">
                    <div className="w-10 h-10 rounded-lg snarbles-gradient-purple flex items-center justify-center">
                      <span className="text-white font-bold">+</span>
                    </div>
                    <div>
                      <p className="snarbles-subheading text-sm">More Chains</p>
                      <p className="text-xs snarbles-body">Expanding ecosystem</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="snarbles-subheading text-2xl">Security & Compliance</h3>
                <p className="snarbles-body leading-relaxed">
                  Security is at the core of everything we build. Our platform uses:
                </p>
                <ul className="space-y-4 snarbles-body">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1"><Shield className="w-5 h-5 text-green-400" /></div>
                    <div>
                      <span className="snarbles-subheading text-sm">Enterprise-grade Smart Contracts</span>
                      <p className="text-sm">Audited, battle-tested, and continuously monitored</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1"><Shield className="w-5 h-5 text-green-400" /></div>
                    <div>
                      <span className="snarbles-subheading text-sm">Non-custodial Architecture</span>
                      <p className="text-sm">We never hold your tokens or private keys</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1"><Shield className="w-5 h-5 text-green-400" /></div>
                    <div>
                      <span className="snarbles-subheading text-sm">Decentralized Infrastructure</span>
                      <p className="text-sm">No central points of failure or control</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1"><Shield className="w-5 h-5 text-green-400" /></div>
                    <div>
                      <span className="snarbles-subheading text-sm">Real-time Verification</span>
                      <p className="text-sm">Automatic security scoring and risk assessment</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 snarbles-glass-subtle px-6 py-3 snarbles-border-glow mb-6">
              <Users className="w-5 h-5 text-green-400 snarbles-animate-pulse" />
              <span className="uppercase tracking-wider text-green-400 font-bold text-sm">Our Team</span>
              <div className="w-2 h-2 bg-green-400 rounded-full snarbles-animate-pulse"></div>
            </div>
            <h2 className="snarbles-subheading text-3xl mb-4">Meet the Builders</h2>
            <p className="snarbles-body max-w-2xl mx-auto">
              Blockchain enthusiasts building the future of token creation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center snarbles-card p-6 hover:border-primary/40 transition-all duration-300">
              <div className="w-28 h-28 rounded-full snarbles-gradient-red mx-auto mb-4 flex items-center justify-center shadow-lg shadow-red-500/30">
                <span className="text-white font-bold text-xl">AJ</span>
              </div>
              <h3 className="snarbles-subheading text-xl">Alex Johnson</h3>
              <p className="snarbles-gradient-text-red font-semibold mb-3">Founder & CEO</p>
              <p className="snarbles-body text-sm max-w-sm mx-auto">
                Former blockchain lead at Ethereum Foundation with 8+ years in crypto development.
              </p>
            </div>
            
            <div className="text-center snarbles-card p-6 hover:border-primary/40 transition-all duration-300">
              <div className="w-28 h-28 rounded-full snarbles-gradient-blue mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-xl">SC</span>
              </div>
              <h3 className="snarbles-subheading text-xl">Sarah Chen</h3>
              <p className="snarbles-gradient-text-blue font-semibold mb-3">CTO</p>
              <p className="snarbles-body text-sm max-w-sm mx-auto">
                Smart contract expert and former lead developer at a top 10 DeFi protocol.
              </p>
            </div>
            
            <div className="text-center snarbles-card p-6 hover:border-primary/40 transition-all duration-300">
              <div className="w-28 h-28 rounded-full snarbles-gradient-green mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="text-white font-bold text-xl">MR</span>
              </div>
              <h3 className="snarbles-subheading text-xl">Michael Rodriguez</h3>
              <p className="snarbles-gradient-text-green font-semibold mb-3">Head of Product</p>
              <p className="snarbles-body text-sm max-w-sm mx-auto">
                Product visionary with experience at leading Web3 startups and traditional fintech.
              </p>
            </div>
          </div>
        </div>
        
        {/* Enhanced Roadmap */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 snarbles-glass-subtle px-6 py-3 snarbles-border-glow mb-6">
              <Rocket className="w-5 h-5 text-orange-400 snarbles-animate-pulse" />
              <span className="uppercase tracking-wider text-orange-400 font-bold text-sm">Roadmap</span>
              <div className="w-2 h-2 bg-orange-400 rounded-full snarbles-animate-pulse"></div>
            </div>
            <h2 className="snarbles-subheading text-3xl mb-4">Our Journey Forward</h2>
            <p className="snarbles-body max-w-2xl mx-auto">
              Where we've been and where we're heading
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-red-500/50 via-blue-500/50 to-green-500/50 -ml-px"></div>
            
            <div className="space-y-12">
              <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 items-center">
                <div className="md:col-span-2 md:text-right order-2 md:order-1">
                  <h3 className="snarbles-subheading text-xl">Q1 2024: Platform Launch</h3>
                  <p className="snarbles-body mt-2">
                    Initial release of Snarbles with Solana and Algorand support
                  </p>
                </div>
                
                <div className="flex justify-center order-1 md:order-2">
                  <div className="w-12 h-12 rounded-full snarbles-gradient-green flex items-center justify-center text-white relative z-10 shadow-lg shadow-green-500/40">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="md:col-span-2 order-3">
                  <div className="snarbles-card p-4 h-full">
                    <ul className="space-y-2 text-sm snarbles-body">
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        Token creation interface
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        Multi-chain support
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        Dashboard and analytics
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 items-center">
                <div className="md:col-span-2 order-2 md:order-3">
                  <h3 className="snarbles-subheading text-xl">Q2 2024: Enhanced Features</h3>
                  <p className="snarbles-body mt-2">
                    Expanding functionality with new management tools
                  </p>
                </div>
                
                <div className="flex justify-center order-1 md:order-2">
                  <div className="w-12 h-12 rounded-full snarbles-gradient-blue flex items-center justify-center text-white relative z-10 shadow-lg shadow-blue-500/40">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="md:col-span-2 order-3 md:order-1 md:text-right">
                  <div className="snarbles-card p-4 h-full">
                    <ul className="space-y-2 text-sm snarbles-body">
                      <li className="flex items-center md:justify-end">
                        <span>Advanced tokenomics designer</span>
                        <Check className="w-4 h-4 text-green-400 ml-2" />
                      </li>
                      <li className="flex items-center md:justify-end">
                        <span>Token verification system</span>
                        <Check className="w-4 h-4 text-green-400 ml-2" />
                      </li>
                      <li className="flex items-center md:justify-end">
                        <span>Enhanced community tools</span>
                        <Clock className="w-4 h-4 text-yellow-400 ml-2" />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 items-center">
                <div className="md:col-span-2 md:text-right order-2 md:order-1">
                  <h3 className="snarbles-subheading text-xl">Q3 2025: SOON Network Integration</h3>
                  <p className="snarbles-body mt-2">
                    Native support for the revolutionary SOON blockchain network
                  </p>
                </div>
                
                <div className="flex justify-center order-1 md:order-2">
                  <div className="w-12 h-12 rounded-full snarbles-gradient-orange flex items-center justify-center text-white relative z-10 shadow-lg shadow-orange-500/40">
                    <Rocket className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="md:col-span-2 order-3">
                  <div className="snarbles-card p-4 h-full">
                    <ul className="space-y-2 text-sm snarbles-body">
                      <li className="flex items-center">
                        <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                        SOON Network token creation
                      </li>
                      <li className="flex items-center">
                        <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                        Cross-chain management
                      </li>
                      <li className="flex items-center">
                        <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                        Enterprise solutions
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced CTA */}
        <div className="snarbles-card-premium p-12 snarbles-glow-red text-center">
          <div className="w-20 h-20 rounded-full snarbles-gradient-red flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/40">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="snarbles-heading text-3xl mb-4">
            Join the Snarbles
            <span className="snarbles-gradient-text-red"> Revolution</span>
          </h2>
          <p className="text-xl snarbles-body max-w-2xl mx-auto mb-8 leading-relaxed">
            Create your token, connect with other creators, and be part of the token revolution
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/create">
              <Button className="snarbles-button-primary text-lg px-8 py-4">
                <Rocket className="w-5 h-5 mr-2" />
                Create Your Token
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" className="snarbles-button-ghost text-lg px-8 py-4">
                <Users className="w-5 h-5 mr-2" />
                Join Community
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}