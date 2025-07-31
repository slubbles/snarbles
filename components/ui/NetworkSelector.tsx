'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { AlertTriangle, Info, CheckCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NetworkSelectorProps {
  selectedNetwork: string;
  onNetworkChange: (network: string) => void;
  userCredits?: number;
  className?: string;
}

const networks = [
  {
    id: 'algorand-testnet',
    name: 'Algorand Testnet',
    type: 'testnet',
    cost: 0,
    description: 'Free test environment - Perfect for development and testing',
    features: ['Free transactions', 'Fast finality', 'Carbon negative'],
    recommendation: 'Recommended for beginners'
  },
  {
    id: 'algorand-mainnet', 
    name: 'Algorand Mainnet',
    type: 'mainnet',
    cost: 5,
    description: 'Production network - Real tokens with actual value',
    features: ['Real transactions', 'Production ready', 'High security'],
    recommendation: 'For live projects'
  },
  {
    id: 'solana-devnet',
    name: 'Solana Devnet', 
    type: 'devnet',
    cost: 0,
    description: 'Free development environment - Great for Solana developers',
    features: ['Free transactions', 'Fast confirmation', 'Developer tools'],
    recommendation: 'Perfect for Solana testing'
  }
];

export function NetworkSelector({ selectedNetwork, onNetworkChange, userCredits = 0, className }: NetworkSelectorProps) {
  const selectedNetworkInfo = networks.find(n => n.id === selectedNetwork);
  const canAfford = (cost: number) => userCredits >= cost;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>Select Network</span>
          <NetworkBadge network={selectedNetwork} size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Selection Info */}
        {selectedNetworkInfo && (
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">{selectedNetworkInfo.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedNetworkInfo.description}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium">
                  Cost: {selectedNetworkInfo.cost === 0 ? 'Free' : `${selectedNetworkInfo.cost} credits`}
                </span>
                {selectedNetworkInfo.cost > 0 && (
                  <Badge variant={canAfford(selectedNetworkInfo.cost) ? "default" : "destructive"} className="text-xs">
                    {canAfford(selectedNetworkInfo.cost) ? 'Affordable' : 'Need more credits'}
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Network Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Choose your blockchain network:</label>
          
          <div className="grid gap-3">
            {networks.map((network) => {
              const isSelected = network.id === selectedNetwork;
              const affordable = canAfford(network.cost);
              
              return (
                <Button
                  key={network.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto p-4 text-left justify-start ${
                    !affordable && network.cost > 0 ? 'opacity-60' : ''
                  }`}
                  onClick={() => onNetworkChange(network.id)}
                  disabled={!affordable && network.cost > 0}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{network.name}</span>
                        <NetworkBadge network={network.id} size="sm" showIcon={false} />
                        {isSelected && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {network.description}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {network.cost === 0 ? 'Free' : `${network.cost} credits`}
                        </Badge>
                        <span className="text-xs font-medium text-primary">
                          {network.recommendation}
                        </span>
                      </div>
                      
                      {network.cost > 0 && !affordable && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                          <CreditCard className="w-3 h-3" />
                          Need {network.cost - userCredits} more credits
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Credits Display */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Your Credits:</span>
          <Badge variant="outline" className="font-medium">
            {userCredits} credits
          </Badge>
        </div>

        {/* Help Text */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Testnet/Devnet:</strong> Perfect for testing - no real money involved.
            <br />
            <strong>Mainnet:</strong> Real blockchain with actual costs and value.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
