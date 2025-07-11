'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Shield,
  Globe,
  Settings,
  Smartphone,
  Monitor,
  Wifi
} from 'lucide-react';

interface TroubleshootingStep {
  title: string;
  description: string;
  action?: {
    text: string;
    url?: string;
    onClick?: () => void;
  };
  level: 'easy' | 'medium' | 'advanced';
}

interface WalletProvider {
  name: string;
  icon: string;
  downloadUrl: string;
  chromeId?: string;
  firefoxId?: string;
  troubleshooting: TroubleshootingStep[];
}

const WALLET_PROVIDERS: WalletProvider[] = [
  {
    name: 'Phantom',
    icon: '👻',
    downloadUrl: 'https://phantom.app/',
    chromeId: 'bfnaelmomeimhlpmgjnjophhpkkoljpa',
    troubleshooting: [
      {
        title: 'Install Phantom Extension',
        description: 'Download and install the official Phantom wallet browser extension.',
        action: { text: 'Download Phantom', url: 'https://phantom.app/' },
        level: 'easy'
      },
      {
        title: 'Enable Extension',
        description: 'Make sure the Phantom extension is enabled in your browser extensions.',
        level: 'easy'
      },
      {
        title: 'Unlock Wallet',
        description: 'Open Phantom and enter your password to unlock the wallet.',
        level: 'easy'
      },
      {
        title: 'Check Network',
        description: 'Verify that Phantom is connected to the correct Solana network (Mainnet/Devnet).',
        level: 'medium'
      },
      {
        title: 'Clear Browser Data',
        description: 'Clear browser cache and cookies, then restart browser.',
        level: 'medium'
      }
    ]
  },
  {
    name: 'Solflare',
    icon: '🔥',
    downloadUrl: 'https://solflare.com/',
    chromeId: 'bhhhlbepdkbapadjdnnojkbgioiodbic',
    troubleshooting: [
      {
        title: 'Install Solflare Extension',
        description: 'Download and install the official Solflare wallet browser extension.',
        action: { text: 'Download Solflare', url: 'https://solflare.com/' },
        level: 'easy'
      },
      {
        title: 'Create or Import Wallet',
        description: 'Set up your Solflare wallet by creating new or importing existing.',
        level: 'easy'
      },
      {
        title: 'Grant Permissions',
        description: 'Allow Solflare to connect to this website when prompted.',
        level: 'easy'
      },
      {
        title: 'Check Connection',
        description: 'Ensure Solflare is set to the correct RPC endpoint.',
        level: 'medium'
      }
    ]
  }
];

const COMMON_ISSUES: TroubleshootingStep[] = [
  {
    title: 'Wallet Not Detected',
    description: 'Browser cannot find any installed wallet extensions.',
    level: 'easy'
  },
  {
    title: 'Connection Rejected',
    description: 'Wallet extension exists but connection was denied.',
    level: 'easy'
  },
  {
    title: 'Network Mismatch',
    description: 'Wallet is connected to different network than required.',
    level: 'medium'
  },
  {
    title: 'Transaction Failures',
    description: 'Wallet connects but transactions fail to process.',
    level: 'medium'
  },
  {
    title: 'Extension Conflicts',
    description: 'Multiple wallet extensions causing conflicts.',
    level: 'advanced'
  }
];

export function WalletTroubleshootingGuide() {
  const [selectedWallet, setSelectedWallet] = useState<string>('phantom');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const toggleStepCompletion = (stepTitle: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepTitle)) {
      newCompleted.delete(stepTitle);
    } else {
      newCompleted.add(stepTitle);
    }
    setCompletedSteps(newCompleted);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getBrowserIcon = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    // Using Monitor icon for all browsers since specific browser icons aren't available
    return <Monitor className="w-4 h-4" />;
  };

  const currentWallet = WALLET_PROVIDERS.find(w => w.name.toLowerCase() === selectedWallet);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            <CardTitle className="text-2xl">Wallet Troubleshooting Guide</CardTitle>
          </div>
          <CardDescription>
            Step-by-step solutions for common Solana wallet connection issues
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getBrowserIcon()}
              <div>
                <div className="font-medium text-sm">Browser</div>
                <div className="text-xs text-muted-foreground">
                  {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Wifi className="w-4 h-4" />
              <div>
                <div className="font-medium text-sm">Connection</div>
                <div className="text-xs text-muted-foreground">
                  {navigator.onLine ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Shield className="w-4 h-4" />
              <div>
                <div className="font-medium text-sm">Security</div>
                <div className="text-xs text-muted-foreground">
                  {location.protocol === 'https:' ? 'HTTPS' : 'HTTP'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Troubleshooting Content */}
      <Tabs defaultValue="wallet-specific" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet-specific">Wallet-Specific</TabsTrigger>
          <TabsTrigger value="common-issues">Common Issues</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Wallet-Specific Troubleshooting */}
        <TabsContent value="wallet-specific" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Wallet</CardTitle>
              <CardDescription>
                Select your wallet for specific troubleshooting steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {WALLET_PROVIDERS.map((wallet) => (
                  <Button
                    key={wallet.name.toLowerCase()}
                    variant={selectedWallet === wallet.name.toLowerCase() ? 'default' : 'outline'}
                    onClick={() => setSelectedWallet(wallet.name.toLowerCase())}
                    className="justify-start h-auto p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">{wallet.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Solana wallet extension
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Wallet-Specific Steps */}
              {currentWallet && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{currentWallet.name} Troubleshooting</h3>
                    <Badge variant="outline">
                      {completedSteps.size}/{currentWallet.troubleshooting.length} completed
                    </Badge>
                  </div>
                  
                  {currentWallet.troubleshooting.map((step, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{index + 1}. {step.title}</span>
                              <Badge className={`text-xs h-5 ${getLevelColor(step.level)}`}>
                                {step.level}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {step.description}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={completedSteps.has(step.title) ? "default" : "outline"}
                                onClick={() => toggleStepCompletion(step.title)}
                                className="h-7"
                              >
                                {completedSteps.has(step.title) ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <div className="w-3 h-3 mr-1 border rounded-full" />
                                )}
                                {completedSteps.has(step.title) ? 'Done' : 'Mark Complete'}
                              </Button>
                              
                              {step.action && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (step.action?.url) {
                                      window.open(step.action.url, '_blank');
                                    } else if (step.action?.onClick) {
                                      step.action.onClick();
                                    }
                                  }}
                                  className="h-7"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  {step.action.text}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Common Issues */}
        <TabsContent value="common-issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Connection Issues</CardTitle>
              <CardDescription>
                Frequent problems and their solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {COMMON_ISSUES.map((issue, index) => (
                  <AccordionItem key={index} value={`issue-${index}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span>{issue.title}</span>
                        <Badge className={`text-xs h-5 ${getLevelColor(issue.level)}`}>
                          {issue.level}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <p className="text-sm text-muted-foreground mb-3">
                        {issue.description}
                      </p>
                      {/* Add specific solutions here */}
                      <div className="space-y-2 text-sm">
                        <div>• Check if wallet extension is installed and enabled</div>
                        <div>• Refresh the page and try connecting again</div>
                        <div>• Disable other wallet extensions temporarily</div>
                        <div>• Clear browser cache and restart browser</div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Troubleshooting */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Troubleshooting</CardTitle>
              <CardDescription>
                For developers and advanced users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="w-4 h-4" />
                <AlertDescription>
                  These steps are for advanced users. Proceed with caution.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Console Debugging</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Open browser developer tools (F12) and check for wallet-related errors.
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    window.phantom?.solana || window.solflare || window.backpack
                  </code>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Network Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    Verify RPC endpoints and network settings in your wallet.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Extension Conflicts</h4>
                  <p className="text-sm text-muted-foreground">
                    Disable all other wallet extensions and test with only one enabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Still Need Help */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">Still Need Help?</h3>
          <p className="text-muted-foreground mb-4">
            If you're still experiencing issues, reach out for additional support.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => window.open('/support', '_blank')}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletTroubleshootingGuide; 