/**
 * Donations List Page
 * ===================
 * Manage and view all donations with PAN and fee fields
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { adminApi } from '@/services/api';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

// Mask PAN number for display
function maskPan(pan: string | null): string {
  if (!pan || pan.length !== 10) return '-';
  return pan.substring(0, 5) + '****' + pan.substring(9);
}

export default function DonationsList() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchDonations();
  }, [page, status]);

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDonations({ 
        page, 
        limit: 10, 
        status: status || undefined,
        search: search || undefined 
      });
      
      setDonations(response.data?.donations || []);
      setPagination(response.data?.pagination);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Failed to fetch donations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportDonations();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `donations-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDonations();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Donations</h1>
          <p className="text-slate-500">Manage and track all donations</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button type="submit" variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : donations.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Donor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Base</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Fee</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">PAN</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {donations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600">#{donation.id}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{donation.donor?.name || 'Anonymous'}</p>
                            <p className="text-sm text-slate-500">{donation.donor?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          ₹{(donation.baseAmount || donation.amount)?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {donation.feeAmount > 0 ? (
                            <span className="text-emerald-600">
                              ₹{donation.feeAmount.toLocaleString()}
                              {donation.feeCovered && <span className="text-xs ml-1">(covered)</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          ₹{donation.amount?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                          {maskPan(donation.panNumber)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[donation.status] || 'bg-slate-100 text-slate-700'}`}>
                            {donation.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/admin/donations/${donation.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No donations found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
