'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  DollarSign, 
  Users, 
  Zap, 
  CheckCircle, 
  Star,
  Rocket,
  Target,
  TrendingUp
} from 'lucide-react';

interface LeadData {
  name: string;
  email: string;
  company: string;
  useCase: string;
  tokenCount: string;
  budget: string;
  timeline: string;
  message: string;
}

export function LeadGenerationForm() {
  const [formData, setFormData] = useState<LeadData>({
    name: '',
    email: '',
    company: '',
    useCase: '',
    tokenCount: '',
    budget: '',
    timeline: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In real implementation, send to your CRM/email service
    console.log('Lead data:', formData);
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    
    toast({
      title: "Thank you!",
      description: "We'll be in touch within 24 hours with a custom solution.",
    });
  };

  const handleInputChange = (field: keyof LeadData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto glass-card border-green-500/30">
        <CardContent className="text-center p-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-green-500 mb-2">Request Submitted!</h3>
          <p className="text-muted-foreground mb-6">
            We'll analyze your requirements and send you a custom proposal within 24 hours.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Custom pricing proposal</p>
            <p>✅ Technical implementation plan</p>
            <p>✅ Timeline and milestones</p>
            <p>✅ Dedicated support channel</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Value Proposition */}
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-3xl font-bold text-foreground">Enterprise Token Solutions</h2>
        <p className="text-xl text-muted-foreground">
          Scale your token creation with custom pricing and white-label solutions
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <DollarSign className="w-3 h-3 mr-1" />
            Volume Discounts
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Zap className="w-3 h-3 mr-1" />
            Custom Features
          </Badge>
          <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
            <Star className="w-3 h-3 mr-1" />
            Priority Support
          </Badge>
          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
            <Target className="w-3 h-3 mr-1" />
            White-Label Options
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Form */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-500" />
                Get Custom Pricing
              </CardTitle>
              <CardDescription>
                Tell us about your project and we'll create a tailored solution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="useCase">Use Case *</Label>
                    <Select onValueChange={(value) => handleInputChange('useCase', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select use case" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="community">Community Token</SelectItem>
                        <SelectItem value="defi">DeFi Protocol</SelectItem>
                        <SelectItem value="gaming">Gaming/NFT</SelectItem>
                        <SelectItem value="loyalty">Loyalty Program</SelectItem>
                        <SelectItem value="governance">DAO/Governance</SelectItem>
                        <SelectItem value="utility">Utility Token</SelectItem>
                        <SelectItem value="platform">Platform Token</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenCount">Expected Token Volume</Label>
                    <Select onValueChange={(value) => handleInputChange('tokenCount', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select volume" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 tokens</SelectItem>
                        <SelectItem value="10-50">10-50 tokens</SelectItem>
                        <SelectItem value="50-100">50-100 tokens</SelectItem>
                        <SelectItem value="100-500">100-500 tokens</SelectItem>
                        <SelectItem value="500+">500+ tokens</SelectItem>
                        <SelectItem value="ongoing">Ongoing creation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget Range</Label>
                    <Select onValueChange={(value) => handleInputChange('budget', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-1k">Under $1,000</SelectItem>
                        <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                        <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                        <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                        <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                        <SelectItem value="50k+">$50,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeline">Timeline</Label>
                    <Select onValueChange={(value) => handleInputChange('timeline', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asap">ASAP</SelectItem>
                        <SelectItem value="1-2weeks">1-2 weeks</SelectItem>
                        <SelectItem value="1month">1 month</SelectItem>
                        <SelectItem value="2-3months">2-3 months</SelectItem>
                        <SelectItem value="6months+">6+ months</SelectItem>
                        <SelectItem value="exploring">Just exploring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Project Details</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Tell us more about your project, specific requirements, or questions..."
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.name || !formData.email}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Get Custom Proposal
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Tiers Preview */}
        <div className="space-y-4">
          <Card className="glass-card border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-500">Volume Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>1-10 tokens</span>
                  <span className="font-bold">$5 each</span>
                </div>
                <div className="flex justify-between">
                  <span>11-50 tokens</span>
                  <span className="font-bold">$3 each</span>
                </div>
                <div className="flex justify-between">
                  <span>51+ tokens</span>
                  <span className="font-bold">$2 each</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>White-label</span>
                  <span className="font-bold">Custom</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-500">Enterprise Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Custom branding
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  API access
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Dedicated support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  SLA guarantees
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Custom integrations
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-purple-500">Success Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/10 rounded-lg">
                  <p className="font-medium">DeFi Protocol</p>
                  <p className="text-muted-foreground">Saved $50k on development</p>
                </div>
                <div className="p-3 bg-muted/10 rounded-lg">
                  <p className="font-medium">Gaming Platform</p>
                  <p className="text-muted-foreground">Launched in 2 weeks vs 6 months</p>
                </div>
                <div className="p-3 bg-muted/10 rounded-lg">
                  <p className="font-medium">DAO Community</p>
                  <p className="text-muted-foreground">10,000+ tokens created</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
