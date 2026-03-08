/**
 * Payment Settings Page
 * =====================
 * Manage payment, fee, and PAN settings
 */

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Save, 
  Loader2, 
  Percent,
  Receipt,
  CreditCard as CardIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/services/api';

export default function PaymentSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [settings, setSettings] = useState({
    // Fee settings
    enable_fee_coverage: 'true',
    fee_percentage: '2.5',
    fee_coverage_label: 'I would like to cover the 2.5% payment processing fee',
    
    // PAN settings
    enable_pan_field: 'false',
    pan_required: 'false',
    show_pan_on_receipt: 'false',
    
    // Razorpay settings (read-only, from env)
    razorpay_mode: 'test',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getAllSettings();
      if (response.settings) {
        setSettings(prev => ({
          ...prev,
          ...response.settings,
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
      
      await adminApi.updateSettings(settings);
      
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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Settings</h1>
        <p className="text-slate-500">Configure payment processing, fees, and PAN card options</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Payment Fee Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-emerald-600" />
            Payment Fee Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Enable Fee Coverage Option</p>
              <p className="text-sm text-slate-500">Allow donors to optionally cover payment processing fees</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_fee_coverage === 'true'}
                onChange={(e) => setSettings({ ...settings, enable_fee_coverage: e.target.checked ? 'true' : 'false' })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div>
            <Label htmlFor="fee_percentage">Fee Percentage (%)</Label>
            <Input
              id="fee_percentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.fee_percentage}
              onChange={(e) => setSettings({ ...settings, fee_percentage: e.target.value })}
              className="mt-1"
            />
            <p className="text-sm text-slate-500 mt-1">
              Percentage charged by payment processor (e.g., 2.5 for 2.5%)
            </p>
          </div>

          <div>
            <Label htmlFor="fee_coverage_label">Fee Coverage Checkbox Label</Label>
            <Input
              id="fee_coverage_label"
              value={settings.fee_coverage_label}
              onChange={(e) => setSettings({ ...settings, fee_coverage_label: e.target.value })}
              className="mt-1"
              placeholder="Text shown next to the fee coverage checkbox"
            />
          </div>
        </CardContent>
      </Card>

      {/* PAN Card Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            PAN Card Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Enable PAN Field</p>
              <p className="text-sm text-slate-500">Show PAN number input on donation form</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_pan_field === 'true'}
                onChange={(e) => setSettings({ ...settings, enable_pan_field: e.target.checked ? 'true' : 'false' })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Make PAN Required</p>
              <p className="text-sm text-slate-500">Donors must enter PAN to complete donation</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pan_required === 'true'}
                onChange={(e) => setSettings({ ...settings, pan_required: e.target.checked ? 'true' : 'false' })}
                disabled={settings.enable_pan_field !== 'true'}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${settings.enable_pan_field !== 'true' ? 'bg-slate-300' : 'bg-slate-200 peer-checked:bg-emerald-600 peer-checked:after:translate-x-full'}`}></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Show PAN on Receipt</p>
              <p className="text-sm text-slate-500">Display PAN number (masked) on donation receipt</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.show_pan_on_receipt === 'true'}
                onChange={(e) => setSettings({ ...settings, show_pan_on_receipt: e.target.checked ? 'true' : 'false' })}
                disabled={settings.enable_pan_field !== 'true'}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${settings.enable_pan_field !== 'true' ? 'bg-slate-300' : 'bg-slate-200 peer-checked:bg-emerald-600 peer-checked:after:translate-x-full'}`}></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Razorpay Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-emerald-600" />
            Razorpay Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Current Mode</p>
                <p className="text-sm text-slate-500">
                  {settings.razorpay_mode === 'live' 
                    ? 'Live mode - real transactions' 
                    : 'Test mode - sandbox transactions'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                settings.razorpay_mode === 'live' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {settings.razorpay_mode === 'live' ? 'Live' : 'Test'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-3">
              To change Razorpay mode, update the RAZORPAY_MODE environment variable 
              (live/test) and restart the server.
            </p>
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
