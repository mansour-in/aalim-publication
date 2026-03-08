/**
 * Admin Layout Component
 * ======================
 * Layout with sidebar navigation for admin pages
 */

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Heart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  ScrollText,
  Globe,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/donations', label: 'Donations', icon: Heart },
  { path: '/admin/donors', label: 'Donors', icon: Users },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Campaign', icon: Settings },
  { path: '/admin/site-settings', label: 'Site Settings', icon: Globe },
  { path: '/admin/payment-settings', label: 'Payment', icon: CreditCard },
  { path: '/admin/logs', label: 'Logs', icon: ScrollText },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">Aalim Admin</h1>
                <p className="text-xs text-slate-400">Fundraiser Manager</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <span className="font-semibold text-slate-900">Admin Panel</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
