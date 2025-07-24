'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wand2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Lightbulb,
  Sparkles,
  FileText,
  Image,
  Link,
  Tags,
  Globe,
  Palette,
  Eye,
  Upload,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isOptional: boolean;
}

interface MetadataWizardProps {
  tokenId: string;
  network: 'algorand' | 'solana';
  currentMetadata?: any;
  onComplete: (metadata: any) => Promise<{ success: boolean; error?: string }>;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  // Basic Info
  name: string;
  symbol: string;
  description: string;
  
  // Visual
  image: string;
  animationUrl: string;
  backgroundColor: string;
  
  // Links & Social
  externalUrl: string;
  website: string;
  twitter: string;
  discord: string;
  telegram: string;
  
  // Categories & Tags
  category: string;
  tags: string[];
  
  // Attributes
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  
  // Advanced
  sellerFeeBasisPoints: number;
  collection: string;
  uses: string;
  
  // AI Generated
  aiDescription: string;
  aiTags: string[];
  suggestedCategory: string;
}

const STEPS: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Essential token details',
    icon: <FileText className="w-5 h-5" />,
    isCompleted: false,
    isOptional: false
  },
  {
    id: 'visual',
    title: 'Visual Assets',
    description: 'Images and visual elements',
    icon: <Image className="w-5 h-5" />,
    isCompleted: false,
    isOptional: false
  },
  {
    id: 'links',
    title: 'Links & Social',
    description: 'External links and social media',
    icon: <Link className="w-5 h-5" />,
    isCompleted: false,
    isOptional: true
  },
  {
    id: 'categories',
    title: 'Categories & Tags',
    description: 'Classification and discoverability',
    icon: <Tags className="w-5 h-5" />,
    isCompleted: false,
    isOptional: true
  },
  {
    id: 'attributes',
    title: 'Attributes',
    description: 'Custom properties and traits',
    icon: <Palette className="w-5 h-5" />,
    isCompleted: false,
    isOptional: true
  },
  {
    id: 'preview',
    title: 'Preview & Confirm',
    description: 'Review and finalize',
    icon: <Eye className="w-5 h-5" />,
    isCompleted: false,
    isOptional: false
  }
];

const CATEGORIES = [
  'Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Collectibles',
  'Virtual Worlds', 'Trading Cards', 'Utility', 'Domain Names',
  'Memberships', 'Academic', 'Real Estate', 'Fashion', 'Other'
];

const SUGGESTED_TAGS = [
  'rare', 'limited', 'exclusive', 'original', 'digital', 'collectible',
  'gaming', 'art', 'music', 'sports', 'vintage', 'modern', 'abstract',
  'realistic', 'fantasy', 'sci-fi', 'nature', 'urban', 'minimalist'
];

export default function MetadataWizard({
  tokenId,
  network,
  currentMetadata,
  onComplete,
  isOpen,
  onClose
}: MetadataWizardProps) {
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(STEPS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: currentMetadata?.name || '',
    symbol: currentMetadata?.symbol || '',
    description: currentMetadata?.description || '',
    image: currentMetadata?.image || '',
    animationUrl: currentMetadata?.animation_url || '',
    backgroundColor: currentMetadata?.background_color || '#ffffff',
    externalUrl: currentMetadata?.external_url || '',
    website: currentMetadata?.website || '',
    twitter: currentMetadata?.twitter || '',
    discord: currentMetadata?.discord || '',
    telegram: currentMetadata?.telegram || '',
    category: currentMetadata?.category || '',
    tags: currentMetadata?.tags || [],
    attributes: currentMetadata?.attributes || [],
    sellerFeeBasisPoints: currentMetadata?.seller_fee_basis_points || 0,
    collection: currentMetadata?.collection || '',
    uses: currentMetadata?.uses || '',
    aiDescription: '',
    aiTags: [],
    suggestedCategory: ''
  });

  // Calculate progress
  const calculateProgress = () => {
    const completedSteps = steps.filter(step => step.isCompleted).length;
    return (completedSteps / steps.length) * 100;
  };

  // Validate current step
  const validateStep = (stepId: string): boolean => {
    switch (stepId) {
      case 'basic':
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 'visual':
        return formData.image.trim() !== '';
      case 'links':
        return true; // Optional step
      case 'categories':
        return true; // Optional step
      case 'attributes':
        return true; // Optional step
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  // Update step completion status
  const updateStepCompletion = () => {
    const updatedSteps = steps.map(step => ({
      ...step,
      isCompleted: validateStep(step.id)
    }));
    setSteps(updatedSteps);
  };

  useEffect(() => {
    updateStepCompletion();
  }, [formData]);

  // Navigate to step
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  // Next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Previous step
  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Generate AI suggestions
  const generateAISuggestions = async () => {
    setIsGeneratingAI(true);
    
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const suggestions = {
        description: `An innovative ${formData.category || 'digital'} asset with unique characteristics. This token represents a carefully crafted piece that showcases exceptional quality and attention to detail.`,
        tags: ['innovative', 'unique', 'quality', 'digital', 'exclusive'],
        category: formData.category || 'Art'
      };
      
      setFormData(prev => ({
        ...prev,
        aiDescription: suggestions.description,
        aiTags: suggestions.tags,
        suggestedCategory: suggestions.category
      }));
      
      toast({
        title: "AI Suggestions Generated",
        description: "Review the AI-generated content and apply what you like",
      });
    } catch (error) {
      toast({
        title: "AI Generation Failed",
        description: "Failed to generate AI suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Apply AI suggestions
  const applyAISuggestion = (type: 'description' | 'tags' | 'category') => {
    switch (type) {
      case 'description':
        setFormData(prev => ({ ...prev, description: prev.aiDescription }));
        break;
      case 'tags':
        setFormData(prev => ({ ...prev, tags: [...new Set([...prev.tags, ...prev.aiTags])] }));
        break;
      case 'category':
        setFormData(prev => ({ ...prev, category: prev.suggestedCategory }));
        break;
    }
    
    toast({
      title: "Applied",
      description: `AI-generated ${type} has been applied`,
    });
  };

  // Add attribute
  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  // Update attribute
  const updateAttribute = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  // Add tag
  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Handle form completion
  const handleComplete = async () => {
    setIsProcessing(true);
    
    try {
      // Prepare final metadata
      const finalMetadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: formData.image,
        animation_url: formData.animationUrl || undefined,
        background_color: formData.backgroundColor,
        external_url: formData.externalUrl || undefined,
        attributes: formData.attributes.filter(attr => attr.trait_type && attr.value),
        properties: {
          category: formData.category,
          tags: formData.tags,
          website: formData.website || undefined,
          social: {
            twitter: formData.twitter || undefined,
            discord: formData.discord || undefined,
            telegram: formData.telegram || undefined
          }
        }
      };
      
      // Add network-specific fields
      if (network === 'solana') {
        (finalMetadata as any).seller_fee_basis_points = formData.sellerFeeBasisPoints;
        if (formData.collection) {
          (finalMetadata as any).collection = formData.collection;
        }
      }
      
      const result = await onComplete(finalMetadata);
      
      if (result.success) {
        toast({
          title: "Metadata Updated",
          description: "Token metadata has been successfully updated",
        });
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update metadata');
      }
    } catch (error) {
      console.error('Metadata update failed:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update metadata',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Token Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter token name..."
              />
            </div>
            
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                placeholder="Enter token symbol..."
                maxLength={10}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your token..."
                rows={4}
              />
            </div>
            
            {/* AI Assistance */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Assistance
                </CardTitle>
                <CardDescription>
                  Let AI help generate descriptions and suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateAISuggestions}
                  disabled={isGeneratingAI || !formData.name}
                  className="w-full"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate AI Suggestions
                    </>
                  )}
                </Button>
                
                {formData.aiDescription && (
                  <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">AI-Generated Description:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => applyAISuggestion('description')}
                      >
                        Apply
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{formData.aiDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
        
      case 'visual':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="image">Image URL *</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.png"
              />
              {formData.image && (
                <div className="mt-4">
                  <img
                    src={formData.image}
                    alt="Token preview"
                    className="w-48 h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="animationUrl">Animation URL (Optional)</Label>
              <Input
                id="animationUrl"
                value={formData.animationUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, animationUrl: e.target.value }))}
                placeholder="https://example.com/animation.mp4"
              />
            </div>
            
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-20"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Images should be high quality and optimized for web viewing. Supported formats: JPG, PNG, GIF, SVG
              </AlertDescription>
            </Alert>
          </div>
        );
        
      case 'links':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="externalUrl">External URL</Label>
              <Input
                id="externalUrl"
                value={formData.externalUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                placeholder="https://yourproject.com"
              />
            </div>
            
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                  placeholder="@username"
                />
              </div>
              
              <div>
                <Label htmlFor="discord">Discord</Label>
                <Input
                  id="discord"
                  value={formData.discord}
                  onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
                  placeholder="discord.gg/invite"
                />
              </div>
              
              <div>
                <Label htmlFor="telegram">Telegram</Label>
                <Input
                  id="telegram"
                  value={formData.telegram}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
                  placeholder="t.me/channel"
                />
              </div>
            </div>
          </div>
        );
        
      case 'categories':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              {formData.suggestedCategory && formData.suggestedCategory !== formData.category && (
                <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI suggests: <strong>{formData.suggestedCategory}</strong></span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => applyAISuggestion('category')}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <Label>Tags</Label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <Label className="text-sm">Suggested Tags:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SUGGESTED_TAGS
                      .filter(tag => !formData.tags.includes(tag))
                      .slice(0, 10)
                      .map(tag => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => addTag(tag)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {formData.aiTags.length > 0 && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">AI-Generated Tags:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => applyAISuggestion('tags')}
                      >
                        Apply All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.aiTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-purple-400 border-purple-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'attributes':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Token Attributes</h3>
                <p className="text-sm text-muted-foreground">Add custom properties and traits</p>
              </div>
              <Button onClick={addAttribute} size="sm">
                Add Attribute
              </Button>
            </div>
            
            <div className="space-y-4">
              {formData.attributes.map((attr, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Trait Type</Label>
                        <Input
                          value={attr.trait_type}
                          onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                          placeholder="e.g., Color, Rarity"
                        />
                      </div>
                      <div>
                        <Label>Value</Label>
                        <div className="flex gap-2">
                          <Input
                            value={attr.value}
                            onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                            placeholder="e.g., Blue, Rare"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAttribute(index)}
                            className="text-red-500"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {formData.attributes.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No attributes added yet</p>
                    <Button onClick={addAttribute} variant="outline" className="mt-4">
                      Add First Attribute
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {network === 'solana' && (
              <div>
                <Label htmlFor="sellerFee">Seller Fee (Basis Points)</Label>
                <Input
                  id="sellerFee"
                  type="number"
                  value={formData.sellerFeeBasisPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerFeeBasisPoints: parseInt(e.target.value) || 0 }))}
                  placeholder="0-10000 (0% to 100%)"
                  min="0"
                  max="10000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(formData.sellerFeeBasisPoints / 100).toFixed(2)}% creator royalty
                </p>
              </div>
            )}
          </div>
        );
        
      case 'preview':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Preview Your Token Metadata</h3>
              <p className="text-muted-foreground">Review all information before finalizing</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visual Preview */}
              <Card>
                <CardContent className="p-6">
                  {formData.image ? (
                    <div className="space-y-4">
                      <img
                        src={formData.image}
                        alt={formData.name}
                        className="w-full h-48 object-cover rounded-lg"
                        style={{ backgroundColor: formData.backgroundColor }}
                      />
                      <div>
                        <h4 className="font-medium">{formData.name}</h4>
                        <p className="text-sm text-muted-foreground">{formData.symbol}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Metadata Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Metadata Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {formData.description || 'No description'}
                    </p>
                  </div>
                  
                  {formData.category && (
                    <div>
                      <span className="font-medium">Category:</span>
                      <Badge variant="outline" className="ml-2">{formData.category}</Badge>
                    </div>
                  )}
                  
                  {formData.tags.length > 0 && (
                    <div>
                      <span className="font-medium">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.tags.slice(0, 5).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {formData.tags.length > 5 && (
                          <Badge variant="secondary" className="text-xs">+{formData.tags.length - 5}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {formData.attributes.length > 0 && (
                    <div>
                      <span className="font-medium">Attributes:</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formData.attributes.length} trait{formData.attributes.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Validation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Validation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${formData.name ? 'text-green-500' : 'text-red-500'}`}>
                      {formData.name ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      Token Name {formData.name ? 'Set' : 'Required'}
                    </div>
                    <div className={`flex items-center gap-2 ${formData.description ? 'text-green-500' : 'text-red-500'}`}>
                      {formData.description ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      Description {formData.description ? 'Set' : 'Required'}
                    </div>
                    <div className={`flex items-center gap-2 ${formData.image ? 'text-green-500' : 'text-red-500'}`}>
                      {formData.image ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      Image {formData.image ? 'Set' : 'Required'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${formData.category ? 'text-green-500' : 'text-yellow-500'}`}>
                      {formData.category ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      Category {formData.category ? 'Set' : 'Optional'}
                    </div>
                    <div className={`flex items-center gap-2 ${formData.tags.length > 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                      {formData.tags.length > 0 ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      Tags {formData.tags.length > 0 ? `(${formData.tags.length})` : 'Optional'}
                    </div>
                    <div className={`flex items-center gap-2 ${formData.attributes.length > 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                      {formData.attributes.length > 0 ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      Attributes {formData.attributes.length > 0 ? `(${formData.attributes.length})` : 'Optional'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            Metadata Wizard
          </DialogTitle>
          <DialogDescription>
            Step-by-step metadata creation for token {tokenId}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(calculateProgress())}% Complete
              </span>
            </div>
            <Progress value={calculateProgress()} />
          </div>

          {/* Step Navigation */}
          <div className="mb-6">
            <div className="flex overflow-x-auto pb-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center cursor-pointer whitespace-nowrap ${
                    index === currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={() => goToStep(index)}
                >
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${
                    index === currentStep ? 'bg-primary/10' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      step.isCompleted 
                        ? 'bg-green-500 text-white' 
                        : index === currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {step.isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs opacity-75">{step.description}</div>
                    </div>
                    {step.isOptional && (
                      <Badge variant="outline" className="text-xs ml-2">Optional</Badge>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="h-[400px] overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  disabled={isProcessing || !validateStep('basic') || !validateStep('visual')}
                  className="min-w-[120px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
