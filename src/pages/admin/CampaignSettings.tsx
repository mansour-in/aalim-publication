/**
 * Campaign Settings Page
 * ======================
 * Manage fundraising campaign settings
 */

import { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  Target,
  IndianRupee,
  Building2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/services/api';

export default function CampaignSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [settings, setSettings] = useState({
    fundraisingGoal: 500000,
    pricePerHadith: 500,
    orgName: 'Aalim Publications',
    orgEmail: '',
    orgPhone: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getCampaignSettings();
      if (response.data) {
        setSettings(prev => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      
      await adminApi.updateCampaignSettings({
        fundraisingGoal: Number(settings.fundraisingGoal),
        pricePerHadith: Number(settings.pricePerHadith),
        orgName: settings.orgName,
        orgEmail: settings.orgEmail,
        orgPhone: settings.orgPhone,
      });
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campaign Settings</h1>
        <p className="text-slate-500">Manage your fundraising campaign configuration</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          <CheckCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* Campaign Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Fundraising Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fundraisingGoal">Fundraising Goal (₹)</Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="fundraisingGoal"
                type="number"
                value={settings.fundraisingGoal}
                onChange={(e) => setSettings({ ...settings, fundraisingGoal: parseInt(e.target.value) || 0 })}
                className="pl-10"
                min={0}
                step={1000}
              />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Total amount you want to raise
            </p>
          </div>

          <div>
            <Label htmlFor="pricePerHadith">Price per Hadith (₹)</Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="pricePerHadith"
                type="number"
                value={settings.pricePerHadith}
                onChange={(e) => setSettings({ ...settings, pricePerHadith: parseInt(e.target.value) || 0 })}
                className="pl-10"
                min={1}
                step={50}
              />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Cost to sponsor one hadith translation
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              This equals to approximately <strong>{Math.ceil(settings.fundraisingGoal / settings.pricePerHadith)} hadiths</strong> to be sponsored
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={settings.orgName}
              onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="orgEmail">Contact Email</Label>
            <Input
              id="orgEmail"
              type="email"
              value={settings.orgEmail}
              onChange={(e) => setSettings({ ...settings, orgEmail: e.target.value })}
              className="mt-1"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <Label htmlFor="orgPhone">Contact Phone</Label>
            <Input
              id="orgPhone"
              value={settings.orgPhone}
              onChange={(e) => setSettings({ ...settings, orgPhone: e.target.value })}
              className="mt-1"
              placeholder="+91 98765 43210"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
