/**
 * Setup Wizard Page
 * =================
 * Installation wizard for first-time setup
 */

import { useState, useEffect } from 'react';
import { 
  Check, 
  Loader2, 
  Database, 
  User, 
  Settings, 
  ChevronRight, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setupApi } from '@/services/api';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const steps: SetupStep[] = [
  { id: 'welcome', title: 'Welcome', description: 'Start installation', icon: CheckCircle },
  { id: 'database', title: 'Database', description: 'Connect to MySQL', icon: Database },
  { id: 'admin', title: 'Admin Account', description: 'Create admin user', icon: User },
  { id: 'complete', title: 'Complete', description: 'Finish setup', icon: Settings },
];

export default function Setup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<{ setupComplete: boolean; hasAdminUsers: boolean; dbConnected: boolean } | null>(null);
  
  // Form states
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: 3306,
    database: '',
    user: '',
    password: '',
  });
  
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [campaignSettings, setCampaignSettings] = useState({
    fundraisingGoal: 500000,
    pricePerHadith: 500,
    orgName: 'Aalim Publications',
  });

  // Check setup status on mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await setupApi.getStatus();
      setSetupStatus(response);
      
      if (response.setupComplete) {
        // Setup already done, redirect to home
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
      // If API fails, we assume setup is needed
    }
  };

  const testDatabase = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await setupApi.testDatabase(dbConfig);
      if (response.success) {
        return true;
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Database connection failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseSubmit = async () => {
    const success = await testDatabase();
    if (success) {
      setCurrentStep(2);
    }
  };

  const handleAdminSubmit = async () => {
    if (adminData.password !== adminData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (adminData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setCurrentStep(3);
  };

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await setupApi.install({
        admin: {
          email: adminData.email,
          name: adminData.name,
          password: adminData.password,
        },
        settings: {
          fundraising_goal: campaignSettings.fundraisingGoal,
          price_per_hadith: campaignSettings.pricePerHadith,
          org_name: campaignSettings.orgName,
        },
      });
      
      if (response.success) {
        // Redirect to home after successful setup
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Installation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-[#D4AF37] to-[#C59A2E] rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#05101A]" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Aalim Fundraiser</h2>
              <p className="text-[#8A9BA8]">
                Let&apos;s set up your donation platform. This wizard will guide you through:
              </p>
            </div>
            
            <div className="space-y-3 text-left max-w-sm mx-auto">
              {[
                'Database configuration',
                'Admin account creation',
                'Campaign settings',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#D4AF37]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={() => setCurrentStep(1)}
              className="btn-primary"
            >
              Start Installation
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold mb-2">Database Configuration</h2>
              <p className="text-[#8A9BA8]">
                Enter your MySQL database credentials
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-[#8A9BA8] mb-2 block">Host</Label>
                  <Input
                    type="text"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    className="input-field"
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <Label className="text-sm text-[#8A9BA8] mb-2 block">Port</Label>
                  <Input
                    type="number"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: parseInt(e.target.value) })}
                    className="input-field"
                    placeholder="3306"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-[#8A9BA8] mb-2 block">Database Name</Label>
                <Input
                  type="text"
                  value={dbConfig.database}
                  onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                  className="input-field"
                  placeholder="hadith_fundraiser"
                />
              </div>
              
              <div>
                <Label className="text-sm text-[#8A9BA8] mb-2 block">Username</Label>
                <Input
                  type="text"
                  value={dbConfig.user}
                  onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                  className="input-field"
                  placeholder="root"
                />
              </div>
              
              <div>
                <Label className="text-sm text-[#8A9BA8] mb-2 block">Password</Label>
                <Input
                  type="password"
                  value={dbConfig.password}
                  onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                  className="input-field"
                  placeholder="Enter database password"
                />
              </div>
            </div>
            
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex gap-4">
              <Button 
                onClick={() => setCurrentStep(0)}
                variant="outline"
                className="flex-1 btn-secondary"
              >
                Back
              </Button>
              <Button 
                onClick={handleDatabaseSubmit}
                disabled={isLoading || !dbConfig.database || !dbConfig.user}
                className="flex-1 btn-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    Test & Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold mb-2">Create Admin Account</h2>
              <p className="text-[#8A9BA8]">
                This account will have full access to the admin panel
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-[#8A9BA8] mb-2 block">Full Name</Label>
                <Input
                  type="text"
                  value={adminData.name}
                  onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <Label className="text-sm text-[#8A9BA8] mb-2 block">Email Address</Label>
                <Input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  className="input-field"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div>
                <Label className="text-sm text-[#8A9BA8] mb-2 block">Password</Label>
                <Input
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  className="input-field"
                  placeholder="Min 8 characters"
                />
              </div>
              
              <div>
                <Label className="text-sm text-[#8A9BA8] mb-2 block">Confirm Password</Label>
                <Input
                  type="password"
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4">
              <Label className="text-sm text-[#8A9BA8] mb-4 block">Campaign Settings (Optional)</Label>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-[#8A9BA8] mb-1 block">Organization Name</Label>
                  <Input
                    type="text"
                    value={campaignSettings.orgName}
                    onChange={(e) => setCampaignSettings({ ...campaignSettings, orgName: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[#8A9BA8] mb-1 block">Fundraising Goal (₹)</Label>
                    <Input
                      type="number"
                      value={campaignSettings.fundraisingGoal}
                      onChange={(e) => setCampaignSettings({ ...campaignSettings, fundraisingGoal: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#8A9BA8] mb-1 block">Price per Hadith (₹)</Label>
                    <Input
                      type="number"
                      value={campaignSettings.pricePerHadith}
                      onChange={(e) => setCampaignSettings({ ...campaignSettings, pricePerHadith: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex gap-4">
              <Button 
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="flex-1 btn-secondary"
              >
                Back
              </Button>
              <Button 
                onClick={handleAdminSubmit}
                disabled={!adminData.name || !adminData.email || !adminData.password}
                className="flex-1 btn-primary"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold mb-2">Ready to Complete</h2>
              <p className="text-[#8A9BA8]">
                Review your settings and complete the installation
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#D4AF37]" />
                  Database
                </h3>
                <div className="text-sm text-[#8A9BA8] space-y-1">
                  <p>Host: {dbConfig.host}</p>
                  <p>Database: {dbConfig.database}</p>
                  <p>User: {dbConfig.user}</p>
                </div>
              </div>
              
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  Admin Account
                </h3>
                <div className="text-sm text-[#8A9BA8] space-y-1">
                  <p>Name: {adminData.name}</p>
                  <p>Email: {adminData.email}</p>
                </div>
              </div>
              
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#D4AF37]" />
                  Campaign
                </h3>
                <div className="text-sm text-[#8A9BA8] space-y-1">
                  <p>Organization: {campaignSettings.orgName}</p>
                  <p>Goal: ₹{campaignSettings.fundraisingGoal.toLocaleString()}</p>
                  <p>Price per Hadith: ₹{campaignSettings.pricePerHadith}</p>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex gap-4">
              <Button 
                onClick={() => setCurrentStep(2)}
                variant="outline"
                className="flex-1 btn-secondary"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={handleCompleteSetup}
                disabled={isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // If setup is complete, show message
  if (setupStatus?.setupComplete) {
    return (
      <div className="min-h-screen bg-[#05101A] text-[#E0E6ED] flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
          <h2 className="text-2xl font-bold mb-2">Already Installed</h2>
          <p className="text-[#8A9BA8] mb-6">
            The setup has already been completed. You can now use the application.
          </p>
          <Button onClick={() => window.location.href = '/'} className="btn-primary">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05101A] text-[#E0E6ED] p-4">
      <div className="max-w-2xl mx-auto pt-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient-gold mb-2">Aalim Fundraiser</h1>
          <p className="text-[#8A9BA8]">Setup Wizard</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#C59A2E] text-[#05101A]' 
                      : isCompleted 
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]' 
                        : 'bg-white/10 text-[#8A9BA8]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs ${isActive || isCompleted ? 'text-[#D4AF37]' : 'text-[#8A9BA8]'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Step Content */}
        <div className="glass-card rounded-3xl p-8">
          {renderStep()}
        </div>
        
        {/* Footer */}
        <p className="text-center text-[#8A9BA8] text-sm mt-8">
          Aalim Fundraiser v1.0 • Setup Wizard
        </p>
      </div>
    </div>
  );
}
