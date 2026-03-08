import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Setup from './pages/Setup.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout.tsx'
import AdminLogin from './pages/admin/AdminLogin.tsx'
import AdminDashboard from './pages/admin/AdminDashboard.tsx'
import DonationsList from './pages/admin/DonationsList.tsx'
import DonationDetail from './pages/admin/DonationDetail.tsx'
import DonorsList from './pages/admin/DonorsList.tsx'
import CampaignSettings from './pages/admin/CampaignSettings.tsx'
import SiteSettings from './pages/admin/SiteSettings.tsx'
import PaymentSettings from './pages/admin/PaymentSettings.tsx'
import Reports from './pages/admin/Reports.tsx'
import AdminLogs from './pages/admin/AdminLogs.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/setup" element={<Setup />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="donations" element={<DonationsList />} />
          <Route path="donations/:id" element={<DonationDetail />} />
          <Route path="donors" element={<DonorsList />} />
          <Route path="settings" element={<CampaignSettings />} />
          <Route path="site-settings" element={<SiteSettings />} />
          <Route path="payment-settings" element={<PaymentSettings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
        
        {/* Main App (Donor-facing) */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
