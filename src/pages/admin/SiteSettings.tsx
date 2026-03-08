/**
 * Site Settings Page
 * ==================
 * Manage website appearance and content
 */

import { useState, useEffect } from 'react';
import { 
  Globe, 
  Save, 
  Loader2, 
  Type,
  Image,
  Mail,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/services/api';

export default function SiteSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [settings, setSettings] = useState({
    site_title: 'Ramadan Hadith Fundraiser',
    site_description: 'Support the translation of Hadiths this Ramadan',
    org_name: 'Aalim Publications',
    org_email: '',
    org_phone: '',
    org_address: '',
    share_message: 'I just donated to support Hadith translation. Join me!',
    thank_you_message: 'Thank you for your generous donation! May Allah accept it.',
    footer_text: '© 2026 Aalim Publications. All rights reserved.',
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
        <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
        <p className="text-slate-500">Manage website appearance, content, and organization details</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          <CheckCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            Site Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="site_title">Site Title</Label>
            <Input
              id="site_title"
              value={settings.site_title}
              onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
              className="mt-1"
              placeholder="Website title shown in browser tab"
            />
          </div>

          <div>
            <Label htmlFor="site_description">Site Description</Label>
            <Input
              id="site_description"
              value={settings.site_description}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
              className="mt-1"
              placeholder="Meta description for SEO"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-emerald-600" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="org_name">Organization Name</Label>
            <Input
              id="org_name"
              value={settings.org_name}
              onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="org_email">Contact Email</Label>
              <Input
                id="org_email"
                type="email"
                value={settings.org_email}
                onChange={(e) => setSettings({ ...settings, org_email: e.target.value })}
                className="mt-1"
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <Label htmlFor="org_phone">Contact Phone</Label>
              <Input
                id="org_phone"
                value={settings.org_phone}
                onChange={(e) => setSettings({ ...settings, org_phone: e.target.value })}
                className="mt-1"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="org_address">Organization Address</Label>
            <textarea
              id="org_address"
              value={settings.org_address}
              onChange={(e) => setSettings({ ...settings, org_address: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
              placeholder="Full address for receipts"
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="share_message">Social Share Message</Label>
            <Input
              id="share_message"
              value={settings.share_message}
              onChange={(e) => setSettings({ ...settings, share_message: e.target.value })}
              className="mt-1"
              placeholder="Message shown when sharing on social media"
            />
          </div>

          <div>
            <Label htmlFor="thank_you_message">Thank You Message</Label>
            <Input
              id="thank_you_message"
              value={settings.thank_you_message}
              onChange={(e) => setSettings({ ...settings, thank_you_message: e.target.value })}
              className="mt-1"
              placeholder="Message shown after successful donation"
            />
          </div>

          <div>
            <Label htmlFor="footer_text">Footer Text</Label>
            <Input
              id="footer_text"
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              className="mt-1"
              placeholder="Copyright text in footer"
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
