'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Edit, 
  Save, 
  X, 
  Upload, 
  Globe, 
  Twitter, 
  Github, 
  FileText, 
  Image, 
  Link, 
  Tag, 
  Eye, 
  History, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Camera,
  Trash2,
  Plus,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Enhanced metadata interface
export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
  github?: string;
  telegram?: string;
  discord?: string;
  whitepaper?: string;
  documentation?: string;
  tags: string[];
  category: string;
  properties: Record<string, any>;
  version: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface TokenInfo {
  id: string;
  name: string;
  symbol: string;
  network: 'algorand' | 'solana';
  metadata: TokenMetadata;
  authorities: {
    updateAuthority?: string;
    managerAuthority?: string;
    canUpdate: boolean;
    canDelegate: boolean;
  };
  statistics: {
    holders: number;
    transactions: number;
    volume: string;
  };
}

interface MetadataEditorProps {
  token: TokenInfo;
  userAddress: string;
  onUpdate: (metadata: TokenMetadata) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  isOpen: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

const TOKEN_CATEGORIES = [
  'DeFi',
  'GameFi', 
  'NFT',
  'Utility',
  'Governance',
  'Meme',
  'Stablecoin',
  'Infrastructure',
  'Social',
  'Privacy',
  'Other'
];

const COMMON_TAGS = [
  'trading', 'gaming', 'collectibles', 'payments', 'yield-farming',
  'dao', 'community', 'enterprise', 'experimental', 'beta',
  'audited', 'verified', 'open-source', 'cross-chain'
];

export default function MetadataEditor({ 
  token, 
  userAddress, 
  onUpdate, 
  onClose, 
  isOpen 
}: MetadataEditorProps) {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState<TokenMetadata>(token.metadata);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(token.metadata.image);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Tag management
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(token.metadata.tags || []);

  // Check if user has permission to edit metadata
  const canEdit = token.authorities.canUpdate && 
    (token.authorities.updateAuthority === userAddress || 
     token.authorities.managerAuthority === userAddress);

  // Track changes
  useEffect(() => {
    const hasAnyChanges = JSON.stringify(formData) !== JSON.stringify(token.metadata);
    setHasChanges(hasAnyChanges);
  }, [formData, token.metadata]);

  // Validate form data
  const validateMetadata = async (data: TokenMetadata): Promise<ValidationError[]> => {
    setIsValidating(true);
    const errors: ValidationError[] = [];

    try {
      // Basic validation
      if (!data.name.trim()) {
        errors.push({ field: 'name', message: 'Token name is required' });
      } else if (data.name.length > 32) {
        errors.push({ field: 'name', message: 'Token name must be 32 characters or less' });
      }

      if (!data.symbol.trim()) {
        errors.push({ field: 'symbol', message: 'Token symbol is required' });
      } else if (data.symbol.length > 8) {
        errors.push({ field: 'symbol', message: 'Token symbol must be 8 characters or less' });
      }

      if (data.description.length > 1000) {
        errors.push({ field: 'description', message: 'Description must be 1000 characters or less' });
      }

      // URL validation
      const urlFields = ['website', 'whitepaper', 'documentation'];
      for (const field of urlFields) {
        const url = data[field as keyof TokenMetadata] as string;
        if (url && !isValidUrl(url)) {
          errors.push({ field, message: `Invalid ${field} URL` });
        }
      }

      // Social media validation
      if (data.twitter && !data.twitter.match(/^@?[A-Za-z0-9_]{1,15}$/)) {
        errors.push({ field: 'twitter', message: 'Invalid Twitter handle' });
      }

      if (data.github && !data.github.includes('github.com')) {
        errors.push({ field: 'github', message: 'Invalid GitHub URL' });
      }

      // Image validation
      if (data.image && !isValidImageUrl(data.image)) {
        errors.push({ field: 'image', message: 'Invalid image URL or format' });
      }

      // Network-specific validation
      if (token.network === 'algorand') {
        // Algorand has URL length limitations
        if (data.image.length > 96) {
          errors.push({ field: 'image', message: 'Image URL too long for Algorand (max 96 characters)' });
        }
      }

      // Validate external links (async)
      await validateExternalLinks(data, errors);

    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }

    return errors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    if (!isValidUrl(url)) return false;
    return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url);
  };

  const validateExternalLinks = async (data: TokenMetadata, errors: ValidationError[]) => {
    const linksToCheck = [
      { field: 'website', url: data.website },
      { field: 'whitepaper', url: data.whitepaper },
      { field: 'documentation', url: data.documentation }
    ].filter(link => link.url);

    // Check if links are accessible (with timeout)
    for (const link of linksToCheck) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(link.url!, { 
          method: 'HEAD', 
          signal: controller.signal,
          mode: 'no-cors' // Allow CORS issues but still check if URL exists
        });
        
        clearTimeout(timeoutId);
      } catch (error) {
        // Only add error if it's a clear URL issue, not CORS
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn(`Could not validate ${link.field} URL:`, error);
        }
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof TokenMetadata, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, GIF, SVG, WebP)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Image must be smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);
    setUploadProgress(0);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Simulate upload progress for now
    // In real implementation, this would upload to IPFS/Arweave/S3
    const uploadSimulation = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadSimulation);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Mock upload URL after completion
    setTimeout(() => {
      const mockUrl = `https://ipfs.io/ipfs/Qm${Math.random().toString(36).substring(2)}`;
      handleInputChange('image', mockUrl);
      toast({
        title: "Image Uploaded Successfully",
        description: "Your token image has been uploaded to IPFS",
      });
    }, 2200);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // Handle tag management
  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      handleInputChange('tags', newTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    handleInputChange('tags', newTags);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update this token's metadata",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      // Validate form data
      const errors = await validateMetadata(formData);
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        toast({
          title: "Validation Failed",
          description: `Please fix ${errors.length} error(s) before submitting`,
          variant: "destructive"
        });
        setIsUpdating(false);
        return;
      }

      // Update metadata
      const updatedMetadata = {
        ...formData,
        version: token.metadata.version + 1,
        lastUpdated: new Date().toISOString(),
        updatedBy: userAddress
      };

      const result = await onUpdate(updatedMetadata);
      
      if (result.success) {
        toast({
          title: "Metadata Updated Successfully",
          description: "Your token metadata has been updated on the blockchain",
        });
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update metadata');
      }
      
    } catch (error) {
      console.error('Error updating metadata:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update metadata',
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getValidationError = (field: string) => {
    return validationErrors.find(error => error.field === field)?.message;
  };

  const hasValidationError = (field: string) => {
    return validationErrors.some(error => error.field === field);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-purple-400" />
            Edit Token Metadata
          </DialogTitle>
          <DialogDescription>
            Update metadata for {token.name} ({token.symbol}) on {token.network}
            {!canEdit && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to edit this token's metadata. 
                  Only the update authority can make changes.
                </AlertDescription>
              </Alert>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <div className="mt-6 h-[500px] overflow-y-auto">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Token Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={hasValidationError('name') ? 'border-red-500' : ''}
                      disabled={!canEdit}
                    />
                    {getValidationError('name') && (
                      <p className="text-red-500 text-sm mt-1">{getValidationError('name')}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="symbol">Token Symbol *</Label>
                    <Input
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      className={hasValidationError('symbol') ? 'border-red-500' : ''}
                      disabled={!canEdit}
                    />
                    {getValidationError('symbol') && (
                      <p className="text-red-500 text-sm mt-1">{getValidationError('symbol')}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`min-h-[100px] ${hasValidationError('description') ? 'border-red-500' : ''}`}
                    placeholder="Describe your token's purpose and utility..."
                    disabled={!canEdit}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {getValidationError('description') ? (
                      <p className="text-red-500 text-sm">{getValidationError('description')}</p>
                    ) : (
                      <div />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/1000 characters
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {TOKEN_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Network</Label>
                    <Input
                      value={token.network.charAt(0).toUpperCase() + token.network.slice(1)}
                      disabled
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Visual Tab */}
              <TabsContent value="visual" className="space-y-6">
                <div>
                  <Label>Token Logo</Label>
                  <div className="mt-2">
                    {/* Image Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                    >
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Token logo preview"
                            className="w-32 h-32 object-cover rounded-lg mx-auto"
                          />
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <Progress value={uploadProgress} className="w-full" />
                          )}
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              disabled={!canEdit}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Change Image
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setImagePreview('');
                                setImageFile(null);
                                handleInputChange('image', '');
                              }}
                              disabled={!canEdit}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-lg font-medium">Upload Token Logo</p>
                            <p className="text-sm text-muted-foreground">
                              Drag and drop an image or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Supported formats: JPG, PNG, GIF, SVG, WebP (max 5MB)
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('image-upload')?.click()}
                            disabled={!canEdit}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>

                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </div>

                  {/* Or Image URL */}
                  <div className="mt-4">
                    <Label htmlFor="imageUrl">Or provide image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.image}
                      onChange={(e) => {
                        handleInputChange('image', e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/token-logo.png"
                      className={hasValidationError('image') ? 'border-red-500' : ''}
                      disabled={!canEdit}
                    />
                    {getValidationError('image') && (
                      <p className="text-red-500 text-sm mt-1">{getValidationError('image')}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Links Tab */}
              <TabsContent value="links" className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourproject.com"
                      className={hasValidationError('website') ? 'border-red-500' : ''}
                      disabled={!canEdit}
                    />
                    {getValidationError('website') && (
                      <p className="text-red-500 text-sm mt-1">{getValidationError('website')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="twitter" className="flex items-center gap-2">
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </Label>
                      <Input
                        id="twitter"
                        value={formData.twitter || ''}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        placeholder="@username"
                        className={hasValidationError('twitter') ? 'border-red-500' : ''}
                        disabled={!canEdit}
                      />
                      {getValidationError('twitter') && (
                        <p className="text-red-500 text-sm mt-1">{getValidationError('twitter')}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="github" className="flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        GitHub
                      </Label>
                      <Input
                        id="github"
                        value={formData.github || ''}
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        placeholder="https://github.com/username/repo"
                        className={hasValidationError('github') ? 'border-red-500' : ''}
                        disabled={!canEdit}
                      />
                      {getValidationError('github') && (
                        <p className="text-red-500 text-sm mt-1">{getValidationError('github')}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telegram">Telegram</Label>
                      <Input
                        id="telegram"
                        value={formData.telegram || ''}
                        onChange={(e) => handleInputChange('telegram', e.target.value)}
                        placeholder="https://t.me/username"
                        disabled={!canEdit}
                      />
                    </div>

                    <div>
                      <Label htmlFor="discord">Discord</Label>
                      <Input
                        id="discord"
                        value={formData.discord || ''}
                        onChange={(e) => handleInputChange('discord', e.target.value)}
                        placeholder="https://discord.gg/invite"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="whitepaper" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Whitepaper
                      </Label>
                      <Input
                        id="whitepaper"
                        value={formData.whitepaper || ''}
                        onChange={(e) => handleInputChange('whitepaper', e.target.value)}
                        placeholder="https://docs.yourproject.com/whitepaper.pdf"
                        className={hasValidationError('whitepaper') ? 'border-red-500' : ''}
                        disabled={!canEdit}
                      />
                      {getValidationError('whitepaper') && (
                        <p className="text-red-500 text-sm mt-1">{getValidationError('whitepaper')}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="documentation">Documentation</Label>
                      <Input
                        id="documentation"
                        value={formData.documentation || ''}
                        onChange={(e) => handleInputChange('documentation', e.target.value)}
                        placeholder="https://docs.yourproject.com"
                        className={hasValidationError('documentation') ? 'border-red-500' : ''}
                        disabled={!canEdit}
                      />
                      {getValidationError('documentation') && (
                        <p className="text-red-500 text-sm mt-1">{getValidationError('documentation')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                {/* Tags Management */}
                <div>
                  <Label>Tags</Label>
                  <div className="mt-2 space-y-3">
                    {/* Add Tag Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(newTag);
                          }
                        }}
                        disabled={!canEdit || selectedTags.length >= 10}
                      />
                      <Button
                        variant="outline"
                        onClick={() => addTag(newTag)}
                        disabled={!canEdit || !newTag.trim() || selectedTags.length >= 10}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Common Tags */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Common tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_TAGS.filter(tag => !selectedTags.includes(tag)).map(tag => (
                          <Button
                            key={tag}
                            variant="outline"
                            size="sm"
                            onClick={() => addTag(tag)}
                            disabled={!canEdit || selectedTags.length >= 10}
                            className="text-xs"
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Tags */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Selected tags ({selectedTags.length}/10):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                            {canEdit && (
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authority Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Authority Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {token.authorities.updateAuthority && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Update Authority:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {token.authorities.updateAuthority.slice(0, 20)}...
                        </code>
                      </div>
                    )}
                    {token.authorities.managerAuthority && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Manager Authority:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {token.authorities.managerAuthority.slice(0, 20)}...
                        </code>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Can Update:</span>
                      <Badge variant={token.authorities.canUpdate ? "default" : "secondary"}>
                        {token.authorities.canUpdate ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Token Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Token Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{token.statistics.holders.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Holders</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{token.statistics.transactions.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Transactions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{token.statistics.volume}</p>
                        <p className="text-sm text-muted-foreground">Volume</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Metadata Preview</CardTitle>
                    <CardDescription>
                      This is how your token metadata will appear to users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Token Header */}
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center overflow-hidden">
                          {formData.image ? (
                            <img
                              src={formData.image}
                              alt={formData.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-xl">
                              {formData.symbol.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{formData.name}</h3>
                          <p className="text-muted-foreground">{formData.symbol}</p>
                          <Badge className="mt-1">{formData.category}</Badge>
                        </div>
                      </div>

                      {/* Description */}
                      {formData.description && (
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-muted-foreground">{formData.description}</p>
                        </div>
                      )}

                      {/* Links */}
                      {(formData.website || formData.twitter || formData.github) && (
                        <div>
                          <h4 className="font-semibold mb-2">Links</h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.website && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={formData.website} target="_blank" rel="noopener noreferrer">
                                  <Globe className="w-4 h-4 mr-2" />
                                  Website
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </Button>
                            )}
                            {formData.twitter && (
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={`https://twitter.com/${formData.twitter.replace('@', '')}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Twitter className="w-4 h-4 mr-2" />
                                  Twitter
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </Button>
                            )}
                            {formData.github && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={formData.github} target="_blank" rel="noopener noreferrer">
                                  <Github className="w-4 h-4 mr-2" />
                                  GitHub
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {selectedTags.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.map(tag => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </div>
            )}
            {hasChanges && (
              <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                Unsaved Changes
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canEdit || !hasChanges || isUpdating || validationErrors.length > 0}
              className="min-w-[120px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Metadata
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
