'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TokenConfirmationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/create" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Create Token
          </Link>
        </div>

        {/* Success Message */}
        <div className="text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Token Created Successfully!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your token has been deployed to the blockchain.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard">
                View Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/create">
                Create Another Token
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}