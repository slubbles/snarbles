'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Network, Coins, BarChart3, Shield, Globe, Github, Twitter, Plus, Flame, Pause, Eye, Sparkles, Zap } from 'lucide-react';

interface TokenPreviewProps {
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    totalSupply: string;
    decimals: string;
    logoUrl: string;
    website: string;
    github: string;
    twitter: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
    network: string;
  };
}

export default function TokenPreviewNew({ tokenData }: TokenPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 300);
    return () => clearTimeout(timer);
  }, [tokenData]);

  const formatSupply = (supply: string) => {
    if (!supply) return '0';
    const num = parseFloat(supply) || 0;
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const getNetworkInfo = (network: string) => {
    if (network.includes('algorand')) {
      const isMainnet = network.includes('mainnet');
      return {
        name: isMainnet ? 'Algorand Mainnet' : 'Algorand Testnet',
        color: isMainnet ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30',
        cost: isMainnet ? '~$0.001' : 'Free'
      };
    } else if (network.includes('solana')) {
      return {
        name: 'Solana Devnet',
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        cost: 'Free'
      };
    }
    return {
      name: 'Select Network',
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      cost: 'Unknown'
    };
  };

  const networkInfo = getNetworkInfo(tokenData.network);
  const hasLinks = tokenData.website || tokenData.github || tokenData.twitter;
  const features = [
    { key: 'mintable', label: 'Mintable', icon: Plus, active: tokenData.mintable, color: 'text-green-400' },
    { key: 'burnable', label: 'Burnable', icon: Flame, active: tokenData.burnable, color: 'text-red-400' },
    { key: 'pausable', label: 'Pausable', icon: Pause, active: tokenData.pausable, color: 'text-yellow-400' },
  ];

  if (!mounted) return null;

  return (
    <div className="sticky top-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isUpdating ? 'bg-red-500 animate-pulse' : 'bg-green-500'} shadow-lg`} />
          <h2 className="text-xl font-bold text-white">Live Preview</h2>
        </div>
        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-medium">
          Real-time
        </div>
      </div>

      {/* Main Preview Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gray-900/80 border-2 border-red-500/20 backdrop-blur-sm transition-all duration-300 ${isUpdating ? 'scale-[1.01] border-red-500/40' : 'scale-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5" />
        
        <div className="relative z-10 p-6 space-y-6">
          {/* Token Header */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-gray-700 flex items-center justify-center overflow-hidden">
              {tokenData.logoUrl ? (
                <img 
                  src={tokenData.logoUrl} 
                  alt="Token logo" 
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-8 h-8 text-gray-400"><svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg></div>';
                    }
                  }}
                />
              ) : (
                <Coins className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">
                {tokenData.name || 'Token Name'}
              </h3>
              {tokenData.symbol && (
                <Badge className="mt-2 bg-red-500/20 text-red-500 border-red-500/30 font-mono">
                  ${tokenData.symbol.toUpperCase()}
                </Badge>
              )}
              <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                {tokenData.description || 'Token description will appear here...'}
              </p>
            </div>
          </div>

          {/* Network Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border text-sm font-medium ${networkInfo.color}`}>
              <Network className="w-4 h-4" />
              <span>{networkInfo.name}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Cost</div>
              <div className="text-sm font-bold text-green-500">{networkInfo.cost}</div>
            </div>
          </div>

          {/* Token Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-gray-400">Supply</span>
              </div>
              <div className="text-lg font-bold text-white">{formatSupply(tokenData.totalSupply)}</div>
              <div className="text-xs text-gray-400">
                {tokenData.totalSupply ? parseFloat(tokenData.totalSupply).toLocaleString() : '0'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-400">Decimals</span>
              </div>
              <div className="text-lg font-bold text-white">{tokenData.decimals || '9'}</div>
              <div className="text-xs text-gray-400">Precision</div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span>Features</span>
            </h4>
            <div className="space-y-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    feature.active 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : 'bg-gray-800/30 border border-gray-700'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${feature.active ? feature.color : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${feature.active ? 'text-white' : 'text-gray-400'}`}>
                        {feature.label}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      feature.active ? 'bg-green-500' : 'bg-gray-600'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social Links */}
          {hasLinks && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Links</span>
              </h4>
              <div className="space-y-2">
                {tokenData.website && (
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30 border border-gray-700">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-white">Website</span>
                  </div>
                )}
                {tokenData.github && (
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30 border border-gray-700">
                    <Github className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-white">GitHub</span>
                  </div>
                )}
                {tokenData.twitter && (
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30 border border-gray-700">
                    <Twitter className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white">Twitter</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-red-500 mb-2">Pro Tips</h4>
            <ul className="space-y-1 text-xs text-gray-300">
              <li>• Start with testnet for your first token</li>
              <li>• Add a logo for better recognition</li>
              <li>• Choose decimals carefully (9 recommended)</li>
              <li>• Enable features based on your needs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ready Status */}
      <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-4">
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-green-500" />
          <div>
            <h4 className="text-sm font-bold text-green-500">Ready to Deploy</h4>
            <p className="text-xs text-gray-300 mt-1">
              Your token will be deployed to <span className="font-medium text-green-400">{networkInfo.name}</span>
            </p>
            <p className="text-xs text-gray-400">Est. cost: {networkInfo.cost}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
