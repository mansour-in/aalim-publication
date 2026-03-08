/**
 * Checkout Form Component
 * =======================
 * Enhanced donation form with PAN and fee coverage
 */

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Shield, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { paymentApi } from '@/services/api';

interface CheckoutFormProps {
  quantity: number;
  amount: number;
  hadithPrice: number;
  onSubmit: (data: CheckoutData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface CheckoutData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  panNumber: string;
  isAnonymous: boolean;
  message: string;
  coverFee: boolean;
  baseAmount: number;
  feeAmount: number;
  totalAmount: number;
}

interface PaymentConfig {
  pricePerHadith: number;
  feeCoverageEnabled: boolean;
  feePercentage: number;
  feeCoverageLabel: string;
  panEnabled: boolean;
  panRequired: boolean;
}

export default function CheckoutForm({ 
  quantity, 
  amount, 
  hadithPrice,
  onSubmit, 
  onCancel,
  isLoading = false 
}: CheckoutFormProps) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'India',
    panNumber: '',
    isAnonymous: false,
    message: '',
    coverFee: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const response = await paymentApi.getConfig();
      setConfig(response.config);
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const calculateAmounts = () => {
    if (!config) return { baseAmount: amount, feeAmount: 0, totalAmount: amount };
    
    const baseAmount = amount;
    if (formData.coverFee && config.feeCoverageEnabled) {
      const feeAmount = Math.round(baseAmount * (config.feePercentage / 100));
      return {
        baseAmount,
        feeAmount,
        totalAmount: baseAmount + feeAmount,
      };
    }
    return {
      baseAmount,
      feeAmount: 0,
      totalAmount: baseAmount,
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (config?.panEnabled && config?.panRequired && !formData.panNumber.trim()) {
      newErrors.panNumber = 'PAN number is required';
    } else if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
      newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const amounts = calculateAmounts();
    
    onSubmit({
      ...formData,
      panNumber: formData.panNumber.toUpperCase(),
      ...amounts,
    });
  };

  const amounts = calculateAmounts();

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quantity Summary */}
      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-emerald-600">Hadiths to Sponsor</p>
            <p className="text-2xl font-bold text-emerald-700">{quantity}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-emerald-600">Base Amount</p>
            <p className="text-2xl font-bold text-emerald-700">₹{amounts.baseAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900">Personal Details</h3>
        
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 XXXXX XXXXX"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* PAN Number */}
        {config?.panEnabled && (
          <div>
            <Label htmlFor="panNumber">
              PAN Number {config.panRequired && '*'}
              <span className="text-xs text-slate-500 ml-2">(for 80G tax benefits)</span>
            </Label>
            <Input
              id="panNumber"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
              placeholder="ABCDE1234F"
              maxLength={10}
              className={errors.panNumber ? 'border-red-500' : ''}
            />
            {errors.panNumber && <p className="text-sm text-red-500 mt-1">{errors.panNumber}</p>}
          </div>
        )}

        {/* Address */}
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Country"
            />
          </div>
        </div>

        {/* Message/Dedication */}
        <div>
          <Label htmlFor="message">Message / Dedication (Optional)</Label>
          <Input
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="For self, family, friends..."
          />
        </div>

        {/* Anonymous Checkbox */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
          <input
            type="checkbox"
            id="isAnonymous"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300"
          />
          <Label htmlFor="isAnonymous" className="text-sm mb-0">
            Make this donation anonymous (name won't be shown publicly)
          </Label>
        </div>
      </div>

      {/* Fee Coverage */}
      {config?.feeCoverageEnabled && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="coverFee"
              checked={formData.coverFee}
              onChange={(e) => setFormData({ ...formData, coverFee: e.target.checked })}
              className="w-5 h-5 text-emerald-600 rounded border-slate-300 mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="coverFee" className="font-medium text-slate-900 mb-0">
                {config.feeCoverageLabel}
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                This helps us cover payment processing costs and allocate more funds to the Hadith project.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Amount Breakdown */}
      <div className="p-4 bg-slate-50 rounded-lg space-y-2">
        <h4 className="font-medium text-slate-900">Payment Summary</h4>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Base Donation ({quantity} Hadiths)</span>
          <span className="font-medium">₹{amounts.baseAmount.toLocaleString()}</span>
        </div>
        {formData.coverFee && amounts.feeAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Payment Fee ({config?.feePercentage}%)</span>
            <span className="font-medium">₹{amounts.feeAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-slate-200 pt-2 flex justify-between">
          <span className="font-semibold text-slate-900">Total Amount</span>
          <span className="font-bold text-emerald-600 text-lg">₹{amounts.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Shield className="w-4 h-4" />
        <span>Secure payment via Razorpay. Your information is encrypted.</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>Complete Payment</>
          )}
        </Button>
      </div>
    </form>
  );
}
