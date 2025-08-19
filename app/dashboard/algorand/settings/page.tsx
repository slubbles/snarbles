'use client';

import { useState, useEffect } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  User, 
  Bell, 
  Shield,
  Palette,
  Database,
  RefreshCw,
  Loader2,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface UserSettings {
  displayName: string;
  email: string;
  preferredCurrency: 'USD' | 'EUR' | 'BTC' | 'ETH' | 'ALGO';
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  transactionAlerts: boolean;
  priceAlerts: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
}

interface PrivacySettings {
  publicProfile: boolean;
  showHoldings: boolean;
  showTransactions: boolean;
  analyticsOptOut: boolean;
  dataRetention: '30' | '90' | '365' | 'forever';
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  deviceWhitelist: boolean;
}

export default function AlgorandSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Settings states
  const [userSettings, setUserSettings] = useState<UserSettings>({
    displayName: '',
    email: '',
    preferredCurrency: 'USD',
    timezone: 'UTC',
    language: 'en',
    theme: 'system'
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    transactionAlerts: true,
    priceAlerts: false,
    weeklyReports: true,
    securityAlerts: true
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    publicProfile: false,
    showHoldings: false,
    showTransactions: false,
    analyticsOptOut: false,
    dataRetention: '365'
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 24,
    loginNotifications: true,
    deviceWhitelist: false
  });

  const { toast } = useToast();
  const { 
    connected, 
    address: walletAddress, 
    selectedNetwork 
  } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
    loadSettings();
  }, []);

  // Load user settings from localStorage or API
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('algorand-dashboard-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserSettings(prev => ({ ...prev, ...parsed.user }));
        setNotificationSettings(prev => ({ ...prev, ...parsed.notifications }));
        setPrivacySettings(prev => ({ ...prev, ...parsed.privacy }));
        setSecuritySettings(prev => ({ ...prev, ...parsed.security }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to localStorage or API
  const saveSettings = async () => {
    try {
      setSaving(true);

      const settings = {
        user: userSettings,
        notifications: notificationSettings,
        privacy: privacySettings,
        security: securitySettings,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem('algorand-dashboard-settings', JSON.stringify(settings));

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Generate mock API key
  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sbl_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [apiKey] = useState(generateApiKey());

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!connected || !walletAddress) {
    return (
      <DashboardLayout 
        network="algorand" 
        walletAddress={undefined}
        isConnected={false}
        isAdmin={false}
      >
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Settings className="w-16 h-16 mx-auto text-primary mb-4" />
              <CardTitle>Connect Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Connect your Algorand wallet to access dashboard settings
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      network="algorand" 
      walletAddress={walletAddress}
      isConnected={connected}
      isAdmin={false}
    >
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/algorand">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard Settings</h1>
                <p className="text-muted-foreground">Configure your dashboard preferences and security</p>
              </div>
            </div>
            
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={userSettings.displayName}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Enter your display name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Preferred Currency</Label>
                      <Select
                        value={userSettings.preferredCurrency}
                        onValueChange={(value: any) => setUserSettings(prev => ({ ...prev, preferredCurrency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="BTC">BTC - Bitcoin</SelectItem>
                          <SelectItem value="ETH">ETH - Ethereum</SelectItem>
                          <SelectItem value="ALGO">ALGO - Algorand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={userSettings.theme}
                        onValueChange={(value: any) => setUserSettings(prev => ({ ...prev, theme: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-medium">Connected Wallet</span>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {walletAddress}
                    </p>
                    <Badge variant="default" className="mt-2">
                      {selectedNetwork?.charAt(0).toUpperCase() + selectedNetwork?.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Real-time browser notifications</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Transaction Alerts</p>
                        <p className="text-sm text-muted-foreground">Notify on token transactions</p>
                      </div>
                      <Switch
                        checked={notificationSettings.transactionAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, transactionAlerts: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Price Alerts</p>
                        <p className="text-sm text-muted-foreground">Notify on significant price changes</p>
                      </div>
                      <Switch
                        checked={notificationSettings.priceAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, priceAlerts: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Reports</p>
                        <p className="text-sm text-muted-foreground">Weekly portfolio summaries</p>
                      </div>
                      <Switch
                        checked={notificationSettings.weeklyReports}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Alerts</p>
                        <p className="text-sm text-muted-foreground">Important security notifications</p>
                      </div>
                      <Switch
                        checked={notificationSettings.securityAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, securityAlerts: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Public Profile</p>
                        <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
                      </div>
                      <Switch
                        checked={privacySettings.publicProfile}
                        onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, publicProfile: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show Holdings</p>
                        <p className="text-sm text-muted-foreground">Display token balances publicly</p>
                      </div>
                      <Switch
                        checked={privacySettings.showHoldings}
                        onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showHoldings: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show Transactions</p>
                        <p className="text-sm text-muted-foreground">Display transaction history publicly</p>
                      </div>
                      <Switch
                        checked={privacySettings.showTransactions}
                        onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showTransactions: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Analytics Opt-out</p>
                        <p className="text-sm text-muted-foreground">Disable usage analytics collection</p>
                      </div>
                      <Switch
                        checked={privacySettings.analyticsOptOut}
                        onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, analyticsOptOut: checked }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data Retention Period</Label>
                      <Select
                        value={privacySettings.dataRetention}
                        onValueChange={(value: any) => setPrivacySettings(prev => ({ ...prev, dataRetention: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                          <SelectItem value="forever">Forever</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                      </div>
                      <Switch
                        checked={securitySettings.twoFactorEnabled}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Login Notifications</p>
                        <p className="text-sm text-muted-foreground">Notify on new device logins</p>
                      </div>
                      <Switch
                        checked={securitySettings.loginNotifications}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Device Whitelist</p>
                        <p className="text-sm text-muted-foreground">Only allow approved devices</p>
                      </div>
                      <Switch
                        checked={securitySettings.deviceWhitelist}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, deviceWhitelist: checked }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Session Timeout (hours)</Label>
                      <Select
                        value={securitySettings.sessionTimeout.toString()}
                        onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="6">6 hours</SelectItem>
                          <SelectItem value="12">12 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="168">1 week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-yellow-700 dark:text-yellow-300">Security Recommendation</span>
                    </div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Enable two-factor authentication and login notifications for enhanced security.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Settings */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    API Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>API Key</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Use this API key to access your dashboard data programmatically
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">API Permissions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Read token data</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Read transactions</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Read analytics</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-700 dark:text-blue-300">API Documentation</span>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        Access comprehensive API documentation and examples.
                      </p>
                      <Button variant="outline" size="sm">
                        View Documentation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <Trash2 className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Reset All Settings</h4>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                      This will reset all your dashboard settings to default values. This action cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm">
                      Reset Settings
                    </Button>
                  </div>

                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Delete Account Data</h4>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                      Permanently delete all your account data and settings. This action cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm">
                      Delete Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
