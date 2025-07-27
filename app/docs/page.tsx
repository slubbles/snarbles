import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  Globe, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  Code, 
  Coins, 
  Gamepad2,
  ExternalLink,
  Download,
  BookOpen,
  Target,
  Rocket
} from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-4">
              <BookOpen className="w-4 h-4 mr-2" />
              Official Documentation
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
              Snarbles Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The future of no-code blockchain development. Multi-chain token creation, 
              NFT generation, and decentralized ecosystem building—all without writing a single line of code.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Rocket className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Download Whitepaper
              </Button>
            </div>
          </div>

          {/* Executive Summary */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center">
                <Target className="w-6 h-6 mr-3 text-primary" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p className="text-lg leading-relaxed">
                Snarbles revolutionizes blockchain development by eliminating technical barriers through 
                intuitive no-code solutions. Our platform enables creators, entrepreneurs, and businesses 
                to harness blockchain technology without programming expertise.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-muted/5 rounded-lg border border-border">
                  <h4 className="font-semibold text-primary">Multi-Chain</h4>
                  <p className="text-sm text-muted-foreground">Algorand & Solana</p>
                </div>
                <div className="text-center p-4 bg-muted/5 rounded-lg border border-border">
                  <h4 className="font-semibold text-primary">No-Code</h4>
                  <p className="text-sm text-muted-foreground">Zero Programming</p>
                </div>
                <div className="text-center p-4 bg-muted/5 rounded-lg border border-border">
                  <h4 className="font-semibold text-primary">Production Ready</h4>
                  <p className="text-sm text-muted-foreground">Real Blockchain</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Architecture */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center">
                <Code className="w-6 h-6 mr-3 text-primary" />
                Platform Architecture
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enterprise-grade infrastructure built for scale and reliability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Core Technology Stack */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Core Technology Stack</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Frontend Architecture</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Next.js 14 with TypeScript</li>
                      <li>• Tailwind CSS with Glass Morphism Design</li>
                      <li>• Mobile-First Responsive Design</li>
                      <li>• Real-time State Management</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Blockchain Integration</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Algorand SDK v3.3.1</li>
                      <li>• Solana Web3.js Integration</li>
                      <li>• Multi-wallet Support (Pera, Phantom)</li>
                      <li>• Atomic Transaction Groups</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Network Support */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Multi-Chain Network Support</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-muted/5 border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-foreground">Algorand Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Mainnet</span>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">Live</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Testnet</span>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">Live</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">ASA Token Creation</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Enabled</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/5 border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-foreground">Solana Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Devnet</span>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">Live</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Mainnet</span>
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Q2 2025</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">SPL Token Creation</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Enabled</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ecosystem Roadmap */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-primary" />
                Snarbles Ecosystem Roadmap
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                From token creation to complete blockchain ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Phase 1 */}
              <div className="border-l-2 border-primary pl-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-primary text-primary-foreground">Phase 1</Badge>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                    COMPLETE
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Multi-Chain Token Creation Platform</h3>
                <p className="text-muted-foreground text-sm mb-3">Q4 2024 - Q1 2025</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ Algorand ASA token creation (Mainnet & Testnet)</li>
                  <li>✅ Solana SPL token creation (Devnet)</li>
                  <li>✅ Pera Wallet & Phantom Wallet integration</li>
                  <li>✅ Real-time analytics dashboard</li>
                  <li>✅ Mobile-optimized user experience</li>
                  <li>✅ Production-ready platform deployment</li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className="border-l-2 border-yellow-500 pl-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Phase 2</Badge>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    IN DEVELOPMENT
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground">No-Code NFT Creation Suite</h3>
                <p className="text-muted-foreground text-sm mb-3">Q2 2025 - Q3 2025</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>🔨 Visual NFT designer with drag-and-drop interface</li>
                  <li>🔨 Metaplex integration for Solana NFTs</li>
                  <li>🔨 Algorand ARC-69 NFT standard support</li>
                  <li>🔨 Batch NFT generation and deployment</li>
                  <li>🔨 IPFS metadata hosting integration</li>
                  <li>🔨 Royalty and creator fee management</li>
                </ul>
              </div>

              {/* Phase 3 */}
              <div className="border-l-2 border-blue-500 pl-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Phase 3</Badge>
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    PLANNED
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground">$SNRB Token Economy Launch</h3>
                <p className="text-muted-foreground text-sm mb-3">Q4 2025</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>🎯 Snarbles Token ($SNRB) public launch</li>
                  <li>🎯 Community airdrop campaign</li>
                  <li>🎯 Tasks platform for $SNRB rewards</li>
                  <li>🎯 Revenue sharing model implementation</li>
                  <li>🎯 Governance token functionality</li>
                  <li>🎯 Staking and yield farming mechanisms</li>
                </ul>
              </div>

              {/* Phase 4 */}
              <div className="border-l-2 border-purple-500 pl-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Phase 4</Badge>
                  <Badge variant="secondary" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                    VISION
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Complete Ecosystem Expansion</h3>
                <p className="text-muted-foreground text-sm mb-3">2026 & Beyond</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>🌟 Custom NFT marketplace deployment</li>
                  <li>🌟 Snarvest gaming platform launch</li>
                  <li>🌟 Cross-chain DeFi protocol integration</li>
                  <li>🌟 Enterprise no-code blockchain solutions</li>
                  <li>🌟 DAO governance platform</li>
                  <li>🌟 Mobile app ecosystem</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Current Features */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center">
                <Zap className="w-6 h-6 mr-3 text-primary" />
                Current Platform Features
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Production-ready capabilities available today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <Card className="bg-muted/5 border-border">
                  <CardHeader className="pb-3">
                    <Coins className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-base text-foreground">Token Creation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Multi-chain deployment</p>
                    <p>• Custom tokenomics</p>
                    <p>• Real-time blockchain submission</p>
                    <p>• Explorer integration</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/5 border-border">
                  <CardHeader className="pb-3">
                    <Users className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-base text-foreground">Wallet Integration</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Pera Wallet (Algorand)</p>
                    <p>• Phantom Wallet (Solana)</p>
                    <p>• Mobile-optimized flows</p>
                    <p>• Secure transaction signing</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/5 border-border">
                  <CardHeader className="pb-3">
                    <TrendingUp className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-base text-foreground">Analytics Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Real-time user metrics</p>
                    <p>• Token creation analytics</p>
                    <p>• Revenue tracking</p>
                    <p>• User journey mapping</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/5 border-border">
                  <CardHeader className="pb-3">
                    <Shield className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-base text-foreground">Security & Privacy</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Non-custodial architecture</p>
                    <p>• Client-side transaction signing</p>
                    <p>• Privacy-focused analytics</p>
                    <p>• Enterprise-grade security</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/5 border-border">
                  <CardHeader className="pb-3">
                    <Globe className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-base text-foreground">Cross-Chain Support</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Algorand Mainnet/Testnet</p>
                    <p>• Solana Devnet</p>
                    <p>• Unified interface</p>
                    <p>• Network abstraction</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/5 border-border">
                  <CardHeader className="pb-3">
                    <Code className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-base text-foreground">Developer Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>• No-code interface</p>
                    <p>• Real-time feedback</p>
                    <p>• Error prevention</p>
                    <p>• Mobile-first design</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Business Model */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-primary" />
                Business Model & Revenue Streams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Current Revenue</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                      Platform fees per token creation
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                      Premium feature subscriptions
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                      Analytics and insights access
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Future Revenue</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      $SNRB token appreciation
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      NFT marketplace commissions
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Enterprise licensing deals
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Gaming ecosystem revenue
                    </li>
                  </ul>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="bg-muted/5 p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">Investment Opportunity</h3>
                <p className="text-muted-foreground mb-4">
                  Snarbles represents a unique opportunity to capture value in the growing no-code blockchain space. 
                  With multiple revenue streams, a clear expansion roadmap, and production-ready technology, 
                  we're positioned to become the dominant platform for blockchain development democratization.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">$2T+</div>
                    <div className="text-sm text-muted-foreground">Total Crypto Market</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">50M+</div>
                    <div className="text-sm text-muted-foreground">Crypto Users Globally</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">90%</div>
                    <div className="text-sm text-muted-foreground">Non-Technical Users</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Get Started */}
          <Card className="glass-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Ready to Build the Future?</CardTitle>
              <CardDescription className="text-muted-foreground">
                Join the no-code blockchain revolution today
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/create-token">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Rocket className="w-5 h-5 mr-2" />
                  Create Your First Token
                </Button>
              </Link>
              <Link href="https://github.com/snarbles" target="_blank">
                <Button variant="outline" size="lg">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  GitHub
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground space-y-2 pt-8">
            <p>© 2025 Snarbles Platform. Built by builders, for builders.</p>
            <p>Real builders never stop building.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
