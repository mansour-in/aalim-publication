/**
 * Donors List Page
 * ================
 * View and manage donors
 */

import { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { adminApi } from '@/services/api';

export default function DonorsList() {
  const [donors, setDonors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchDonors();
  }, [page]);

  const fetchDonors = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDonors({ 
        page, 
        limit: 10, 
        search: search || undefined 
      });
      
      setDonors(response.data?.donors || []);
      setPagination(response.data?.pagination);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Failed to fetch donors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDonors();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Donors</h1>
        <p className="text-slate-500">View all donors and their contribution history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Donors</p>
              <p className="text-2xl font-bold text-slate-900">{pagination?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Donors Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : donors.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Donor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total Donations</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {donors.map((donor) => (
                      <tr key={donor.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                              {(donor.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-900">{donor.name || 'Anonymous'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{donor.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{donor.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{donor.totalDonations || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-600">
                          ₹{(donor.totalAmount || 0).toLocaleString()}
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
              <p className="text-slate-500">No donors found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
