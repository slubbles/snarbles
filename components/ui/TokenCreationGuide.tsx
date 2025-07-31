'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, HelpCircle, Wallet, Settings, Rocket } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  optional?: boolean;
}

interface TokenCreationGuideProps {
  walletConnected: boolean;
  formValid: boolean;
  networkSelected: string;
  hasCredits: boolean;
  onStepClick?: (stepId: string) => void;
}

export function TokenCreationGuide({ 
  walletConnected, 
  formValid, 
  networkSelected, 
  hasCredits, 
  onStepClick 
}: TokenCreationGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'wallet',
      title: 'Connect Wallet',
      description: 'Connect your crypto wallet to get started',
      icon: <Wallet className="w-5 h-5" />,
      completed: walletConnected
    },
    {
      id: 'network',
      title: 'Choose Network',
      description: 'Select blockchain network (testnet recommended for beginners)',
      icon: <Settings className="w-5 h-5" />,
      completed: !!networkSelected
    },
    {
      id: 'form',
      title: 'Token Details',
      description: 'Configure your token name, symbol, and features',
      icon: <Circle className="w-5 h-5" />,
      completed: formValid
    },
    {
      id: 'deploy',
      title: 'Deploy Token',
      description: 'Launch your token to the blockchain',
      icon: <Rocket className="w-5 h-5" />,
      completed: false
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  // Auto-advance to next incomplete step
  useEffect(() => {
    const nextIncompleteStep = steps.findIndex(step => !step.completed);
    if (nextIncompleteStep !== -1) {
      setCurrentStep(nextIncompleteStep);
    }
  }, [walletConnected, formValid, networkSelected]);

  const getStepStatus = (step: OnboardingStep, index: number) => {
    if (step.completed) return 'completed';
    if (index === currentStep) return 'current';
    if (index < currentStep) return 'completed';
    return 'upcoming';
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Token Creation Progress</span>
          <Badge variant="outline" className="ml-auto">
            {completedSteps}/{steps.length}
          </Badge>
        </CardTitle>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const Icon = step.completed ? CheckCircle : Circle;
          
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                status === 'current' 
                  ? 'bg-primary/10 border border-primary/20' 
                  : status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
              onClick={() => onStepClick?.(step.id)}
            >
              <Icon 
                className={`w-5 h-5 mt-0.5 ${
                  step.completed ? 'text-green-500' : 
                  status === 'current' ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${
                    status === 'current' ? 'text-primary' : 
                    step.completed ? 'text-green-700' : 'text-foreground'
                  }`}>
                    {step.title}
                  </h4>
                  
                  {status === 'current' && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      Current
                    </Badge>
                  )}
                  
                  {step.completed && (
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                      Complete
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
                
                {/* Step-specific help */}
                {status === 'current' && (
                  <div className="mt-2">
                    {step.id === 'wallet' && !walletConnected && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <HelpCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Click "Connect Wallet" above to link your crypto wallet.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {step.id === 'network' && !networkSelected && (
                      <Alert className="bg-purple-50 border-purple-200">
                        <HelpCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          New to crypto? Choose "Testnet" for free, safe testing.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {step.id === 'form' && !formValid && (
                      <Alert className="bg-orange-50 border-orange-200">
                        <HelpCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Fill in your token name, symbol, and description below.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
              
              {status === 'current' && (
                <ArrowRight className="w-4 h-4 text-primary animate-pulse" />
              )}
            </div>
          );
        })}
        
        {/* Next Steps */}
        {completedSteps === steps.length && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <div className="font-medium text-green-700">Ready to Deploy!</div>
              <div className="text-sm text-green-600 mt-1">
                All steps completed. Click "Create Token" to deploy your token to the blockchain.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
