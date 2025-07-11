'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Users, 
  Link, 
  Copy, 
  TrendingUp, 
  Gift,
  Star,
  Share,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function AffiliatePage() {
  const [affiliateCode, setAffiliateCode] = useState('');
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Mock affiliate data
  const [stats, setStats] = useState({
    clicks: 234,
    signups: 47,
    conversions: 23,
    earnings: 345,
    commission: 50
  });

  const generateAffiliateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setAffiliateCode(code);
    setIsSignedUp(true);
    toast({
      title: "Welcome to Snarbles Affiliates!",
      description: "Your affiliate code has been generated. Start sharing to earn commissions!",
    });
  };

  const copyAffiliateLink = () => {
    const link = `https://snarbles.xyz?ref=${affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Share this link to start earning commissions.",
    });
  };

  const marketingMaterials = [
    {
      type: "Banner",
      size: "728x90",
      description: "Leaderboard banner for websites",
      url: "/banner-728x90.png"
    },
    {
      type: "Square",
      size: "300x300",
      description: "Social media square image",
      url: "/square-300x300.png"
    },
    {
      type: "Video",
      size: "1920x1080",
      description: "30-second promo video",
      url: "/promo-video.mp4"
    }
  ];

  const socialTemplates = [
    {
      platform: "Twitter",
      content: "🚀 Just discovered @Snarbles - create crypto tokens in 30 seconds! No coding required, just $3-5 total cost. Perfect for testing token ideas quickly. Try it: [YOUR_LINK]",
      hashtags: "#crypto #blockchain #tokenomics #defi"
    },
    {
      platform: "LinkedIn",
      content: "Impressed by how easy token creation has become. Snarbles lets you deploy professional tokens in under a minute. Game-changer for Web3 startups and enterprises. [YOUR_LINK]",
      hashtags: "#web3 #blockchain #startup #tokenization"
    },
    {
      platform: "Reddit",
      content: "PSA: You can now create actual crypto tokens in 30 seconds for ~$3. No joke. Just tested Snarbles and deployed my first token to Algorand mainnet. This is wild. [YOUR_LINK]",
      hashtags: "r/cryptocurrency r/algorand r/solana"
    }
  ];

  return (
    <div className="min-h-screen app-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Snarbles Affiliate Program
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Earn 50% commission on every token creation. Join thousands of affiliates earning passive income with Snarbles.
          </p>
          {!isSignedUp && (
            <Button 
              onClick={generateAffiliateCode}
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Gift className="w-4 h-4 mr-2" />
              Join Affiliate Program
            </Button>
          )}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-green-500/20">
            <CardHeader className="text-center">
              <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <CardTitle className="text-green-500">50% Commission</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Earn $1.50-$25+ per conversion. Higher tiers = higher commissions.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-blue-500/20">
            <CardHeader className="text-center">
              <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <CardTitle className="text-blue-500">Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Earn from repeat customers and subscription upgrades.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-purple-500/20">
            <CardHeader className="text-center">
              <Star className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <CardTitle className="text-purple-500">Premium Support</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Dedicated affiliate manager and marketing materials.
              </p>
            </CardContent>
          </Card>
        </div>

        {isSignedUp && (
          <>
            {/* Affiliate Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Stats */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Performance Dashboard
                  </CardTitle>
                  <CardDescription>Your affiliate metrics this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/10 rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">{stats.clicks}</div>
                      <div className="text-sm text-muted-foreground">Clicks</div>
                    </div>
                    <div className="text-center p-4 bg-muted/10 rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">{stats.signups}</div>
                      <div className="text-sm text-muted-foreground">Signups</div>
                    </div>
                    <div className="text-center p-4 bg-muted/10 rounded-lg">
                      <div className="text-2xl font-bold text-orange-500">{stats.conversions}</div>
                      <div className="text-sm text-muted-foreground">Conversions</div>
                    </div>
                    <div className="text-center p-4 bg-muted/10 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">${stats.earnings}</div>
                      <div className="text-sm text-muted-foreground">Earnings</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                        <div className="text-lg font-bold text-green-500">
                          {((stats.conversions / stats.clicks) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg. Commission</div>
                        <div className="text-lg font-bold text-green-500">
                          ${(stats.earnings / stats.conversions).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Affiliate Link */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Link className="w-5 h-5 mr-2 text-blue-500" />
                    Your Affiliate Link
                  </CardTitle>
                  <CardDescription>Share this link to start earning commissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Affiliate Code</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={affiliateCode} readOnly className="font-mono" />
                      <Badge variant="outline">{stats.commission}% commission</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking Link</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={`https://snarbles.xyz?ref=${affiliateCode}`} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        onClick={copyAffiliateLink}
                        variant="outline"
                        size="sm"
                      >
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full">
                      <Share className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Preview Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Marketing Materials */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-purple-500" />
                  Marketing Materials
                </CardTitle>
                <CardDescription>Ready-to-use banners, videos, and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {marketingMaterials.map((material, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{material.type}</h4>
                        <Badge variant="outline">{material.size}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {material.description}
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Templates */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share className="w-5 h-5 mr-2 text-orange-500" />
                  Social Media Templates
                </CardTitle>
                <CardDescription>Pre-written content for social platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {socialTemplates.map((template, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{template.platform}</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              template.content.replace('[YOUR_LINK]', `https://snarbles.xyz?ref=${affiliateCode}`)
                            );
                            toast({ title: "Template copied!", description: "Ready to paste and share" });
                          }}
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.content.replace('[YOUR_LINK]', 'https://snarbles.xyz?ref=...')}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {template.hashtags}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Commission Structure */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              Commission Structure
            </CardTitle>
            <CardDescription>Transparent pricing and your earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-border rounded-lg">
                <h3 className="text-lg font-semibold text-blue-500 mb-2">Basic Tier</h3>
                <div className="text-3xl font-bold mb-2">$1.50</div>
                <div className="text-sm text-muted-foreground">
                  50% of $3 fee
                </div>
              </div>
              <div className="text-center p-6 border border-purple-500/50 rounded-lg bg-purple-500/10">
                <h3 className="text-lg font-semibold text-purple-500 mb-2">Pro Tier</h3>
                <div className="text-3xl font-bold mb-2">$7.50</div>
                <div className="text-sm text-muted-foreground">
                  50% of $15 fee
                </div>
              </div>
              <div className="text-center p-6 border border-border rounded-lg">
                <h3 className="text-lg font-semibold text-orange-500 mb-2">Enterprise</h3>
                <div className="text-3xl font-bold mb-2">$25+</div>
                <div className="text-sm text-muted-foreground">
                  50% of $50+ fee
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="font-semibold text-green-500 mb-2">Bonus Opportunities</h4>
              <ul className="text-sm space-y-1">
                <li>• $50 bonus for first 10 conversions</li>
                <li>• $100 bonus for reaching 50 conversions/month</li>
                <li>• 60% commission tier after 100 conversions</li>
                <li>• Enterprise deal referrals: $500-2000 commission</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
