import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Lightbulb, AlertTriangle } from 'lucide-react';

interface AlgorandDecimalWarningProps {
  supply: number;
  decimals: number;
  maxSafeSupply: number;
}

export function AlgorandDecimalWarning({ supply, decimals, maxSafeSupply }: AlgorandDecimalWarningProps) {
  // Calculate alternative options
  const with6Decimals = Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, 6));
  const with3Decimals = Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, 3));
  
  return (
    <div className="space-y-3 mt-3">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="space-y-2">
            <p className="font-medium">Supply exceeds Algorand's JavaScript SDK limits</p>
            <p className="text-sm">
              Your supply of {supply.toLocaleString()} tokens with {decimals} decimals exceeds 
              the maximum safe integer limit ({maxSafeSupply.toLocaleString()} tokens).
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">Why this happens:</p>
            <p className="text-sm">
              Algorand's SDK uses JavaScript numbers directly, while Solana/Ethereum use BigNumber libraries. 
              This creates a {Number.MAX_SAFE_INTEGER.toLocaleString()} limit for Algorand tokens.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Alert className="border-green-200 bg-green-50">
        <Lightbulb className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="space-y-2">
            <p className="font-medium">Recommended solutions:</p>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li>
                <strong>Use 6 decimals:</strong> Allows up to {with6Decimals.toLocaleString()} tokens 
                (like USDC) - <em>Most popular choice</em>
              </li>
              <li>
                <strong>Use 3 decimals:</strong> Allows up to {with3Decimals.toLocaleString()} tokens 
                (still precise to 0.001)
              </li>
              <li>
                <strong>Reduce supply:</strong> Keep {decimals} decimals but limit to {maxSafeSupply.toLocaleString()} tokens
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        💡 <strong>Fun fact:</strong> Major tokens use conservative decimals - USDC (6), ALGO (6), DAI (18 but on Ethereum). 
        Only Solana commonly uses 9 decimals because their SDK handles large numbers natively.
      </div>
    </div>
  );
}
