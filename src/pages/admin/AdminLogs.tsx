/**
 * Admin Logs Page
 * ===============
 * View system logs and activity
 */

import { useState, useEffect } from 'react';
import { 
  ScrollText, 
  Loader2, 
  AlertCircle, 
  Info,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { adminApi } from '@/services/api';

const levelConfig: Record<string, { icon: any; color: string; bg: string }> = {
  error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  warn: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  debug: { icon: CheckCircle, color: 'text-slate-600', bg: 'bg-slate-50' },
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [level, category]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getLogs({ 
        level: level || undefined,
        category: category || undefined,
        limit: 100 
      });
      
      setLogs(response.data?.logs || []);
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Logs</h1>
          <p className="text-slate-500">View application logs and activity</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            <option value="auth">Authentication</option>
            <option value="payment">Payment</option>
            <option value="donation">Donation</option>
            <option value="email">Email</option>
            <option value="system">System</option>
          </select>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : logs.length > 0 ? (
            <div className="divide-y divide-slate-200 max-h-[600px] overflow-auto">
              {logs.map((log, index) => {
                const config = levelConfig[log.level] || levelConfig.info;
                const Icon = config.icon;
                
                return (
                  <div key={index} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                            {log.level?.toUpperCase()}
                          </span>
                          {log.category && (
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {log.category}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-900 mt-1">{log.message}</p>
                        {log.details && (
                          <pre className="mt-2 text-xs text-slate-600 bg-slate-100 p-2 rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
