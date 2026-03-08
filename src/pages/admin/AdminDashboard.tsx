/**
 * Admin Dashboard Page
 * ====================
 * Overview stats and recent activity
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi, donationApi } from '@/services/api';

interface DashboardStats {
  totalRaised: number;
  totalDonors: number;
  totalDonations: number;
  goalAmount: number;
  progressPercentage: number;
  recentDonations: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [publicStats, setPublicStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashboardRes, publicRes] = await Promise.all([
        adminApi.getDashboard(),
        donationApi.getStats(),
      ]);
      
      setStats(dashboardRes.data);
      setPublicStats(publicRes.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Raised',
      value: `₹${(publicStats?.raised || 0).toLocaleString()}`,
      subtitle: `of ₹${(publicStats?.goal || 500000).toLocaleString()} goal`,
      icon: TrendingUp,
      trend: '+12%',
      trendUp: true,
      color: 'emerald',
    },
    {
      title: 'Total Donors',
      value: publicStats?.donors || 0,
      subtitle: 'Unique contributors',
      icon: Users,
      trend: '+5%',
      trendUp: true,
      color: 'blue',
    },
    {
      title: 'Hadiths Sponsored',
      value: publicStats?.sponsored || 0,
      subtitle: `₹${publicStats?.hadithPrice || 500} per hadith`,
      icon: Heart,
      trend: '+8%',
      trendUp: true,
      color: 'rose',
    },
    {
      title: 'Progress',
      value: `${(publicStats?.progress || 0).toFixed(1)}%`,
      subtitle: `${((publicStats?.goal || 500000) - (publicStats?.raised || 0)).toLocaleString()} remaining`,
      icon: Target,
      trend: publicStats?.progress > 50 ? 'On track' : 'Need push',
      trendUp: publicStats?.progress > 50,
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your fundraising campaign</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-${card.color}-100`}>
                <card.icon className={`w-4 h-4 text-${card.color}-600`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500">{card.subtitle}</p>
                <span className={`text-xs flex items-center ${card.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {card.trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {card.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Raised: ₹{(publicStats?.raised || 0).toLocaleString()}</span>
              <span className="text-slate-600">Goal: ₹{(publicStats?.goal || 500000).toLocaleString()}</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(publicStats?.progress || 0, 100)}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 text-center">
              {publicStats?.remaining > 0 
                ? `₹${publicStats.remaining.toLocaleString()} more to reach the goal!`
                : 'Goal reached! 🎉'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Donations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentDonations && stats.recentDonations.length > 0 ? (
            <div className="space-y-4">
              {stats.recentDonations.slice(0, 5).map((donation: any) => (
                <div 
                  key={donation.id} 
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {donation.donorName || 'Anonymous'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      ₹{donation.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {donation.hadithCount} hadiths
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No donations yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
