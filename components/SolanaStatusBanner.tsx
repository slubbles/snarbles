import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function SolanaStatusBanner() {
  return (
    <Card className="border-orange-500/30 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Solana Network Status</span>
        </CardTitle>
        <CardDescription>
          Current status of Solana token creation functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-500/30 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-red-700">⚠️ Solana Platform Temporarily Unavailable</p>
              <p className="text-sm text-red-600">
                The Solana smart contract is experiencing technical issues that prevent platform initialization. 
                Our team is working on a fix.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Alert className="border-green-500/30 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-green-700">✅ Algorand Fully Operational</p>
              <p className="text-sm text-green-600">
                All token creation features are working perfectly on Algorand. Create tokens with lower fees and faster finality.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/create?network=algorand-mainnet" className="flex-1">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              <ArrowRight className="w-4 h-4 mr-2" />
              Create on Algorand Instead
            </Button>
          </Link>
          
          <Link href="/SOLANA_FIX_GUIDE.md" target="_blank" className="flex-1">
            <Button variant="outline" className="w-full border-orange-500 text-orange-700 hover:bg-orange-50">
              <ExternalLink className="w-4 h-4 mr-2" />
              Technical Details
            </Button>
          </Link>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>For Developers:</strong> The smart contract needs debugging and redeployment. 
          Check the technical guide for specific error details and solutions.</p>
        </div>
      </CardContent>
    </Card>
  );
}
