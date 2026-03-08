/**
 * Reports & Analytics Page
 * ========================
 * Detailed analytics and reports
 */

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Loader2, 
  TrendingUp,
  Users,
  Heart,
  Wallet,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/services/api';

export default function Reports() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDashboard();
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportDonations(dateRange);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `donations-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500">Detailed insights and statistics</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Raised</p>
                <p className="text-2xl font-bold text-slate-900">
                  ₹{parseFloat(stats?.totalRaised || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Donors</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.totalDonors || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-lg">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Hadiths Sponsored</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.hadithsSponsored || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Fees Covered</p>
                <p className="text-2xl font-bold text-slate-900">
                  ₹{parseFloat(stats?.totalFeesCovered || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Fee Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Base Donations</p>
              <p className="text-xl font-bold text-slate-900">
                ₹{parseFloat(stats?.totalBaseAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Total Fees</p>
              <p className="text-xl font-bold text-slate-900">
                ₹{parseFloat(stats?.totalFees || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Fees Covered by Donors</p>
              <p className="text-xl font-bold text-emerald-600">
                ₹{parseFloat(stats?.totalFeesCovered || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Donors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Top Donors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.topDonors?.length > 0 ? (
            <div className="space-y-3">
              {stats.topDonors.map((donor: any, index: number) => (
                <div 
                  key={donor.id} 
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-slate-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{donor.name || 'Anonymous'}</p>
                      <p className="text-sm text-slate-500">{donor.email}</p>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-600">
                    ₹{parseFloat(donor.totalDonated || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No donors yet</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-sm text-emerald-600">Today's Donations</p>
              <p className="text-2xl font-bold text-emerald-700">
                ₹{parseFloat(stats?.todayRaised || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600">This Month</p>
              <p className="text-2xl font-bold text-blue-700">
                ₹{parseFloat(stats?.monthRaised || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
