/**
 * Donation Detail Page
 * ====================
 * View detailed information about a specific donation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/services/api';

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  completed: { icon: CheckCircle, color: 'text-emerald-600', label: 'Completed' },
  pending: { icon: Clock, color: 'text-amber-600', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-red-600', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'text-slate-600', label: 'Cancelled' },
};

export default function DonationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [donation, setDonation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchDonation();
    }
  }, [id]);

  const fetchDonation = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDonation(parseInt(id!));
      setDonation(response.data);
    } catch (error: any) {
      console.error('Failed to fetch donation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendReceipt = async () => {
    try {
      setIsResending(true);
      await adminApi.resendReceipt(parseInt(id!));
      setMessage({ type: 'success', text: 'Receipt resent successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to resend receipt' });
    } finally {
      setIsResending(false);
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

  if (!donation) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Donation not found</p>
        <Button onClick={() => navigate('/admin/donations')} className="mt-4">
          Back to Donations
        </Button>
      </div>
    );
  }

  const status = statusConfig[donation.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/donations')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Donation #{donation.id}</h1>
          <p className="text-slate-500">View donation details and manage receipt</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Info */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Status</span>
              <div className={`flex items-center gap-2 ${status.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span className="font-medium">{status.label}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Amount</p>
                <p className="text-xl font-bold text-slate-900">₹{donation.amount?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Hadiths Sponsored</p>
                <p className="text-xl font-bold text-slate-900">{donation.hadithCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Created</span>
                <span className="text-slate-900">{new Date(donation.createdAt).toLocaleString()}</span>
              </div>
              {donation.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Completed</span>
                  <span className="text-slate-900">{new Date(donation.completedAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            {donation.razorpayOrderId && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Payment Details</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Order ID</span>
                    <span className="text-slate-900 font-mono">{donation.razorpayOrderId}</span>
                  </div>
                  {donation.razorpayPaymentId && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment ID</span>
                      <span className="text-slate-900 font-mono">{donation.razorpayPaymentId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donor Info */}
        <Card>
          <CardHeader>
            <CardTitle>Donor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 font-bold">
                  {(donation.donorName || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{donation.donorName || 'Anonymous'}</p>
                <p className="text-sm text-slate-500">{donation.donorEmail}</p>
              </div>
            </div>

            {donation.donorPhone && (
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Phone</span>
                <span className="text-slate-900">{donation.donorPhone}</span>
              </div>
            )}

            {(donation.address || donation.city || donation.country) && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Address</p>
                <p className="text-slate-900">
                  {[donation.address, donation.city, donation.country].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {donation.message && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Message</p>
                <p className="text-slate-900 italic">"{donation.message}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receipt Actions */}
      {donation.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleResendReceipt} 
                disabled={isResending}
                className="flex-1"
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Resend Receipt Email
              </Button>
              
              {donation.receiptUrl && (
                <Button variant="outline" className="flex-1" asChild>
                  <a href={donation.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
