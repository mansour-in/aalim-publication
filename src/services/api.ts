/**
 * API Service
 * ===========
 * Frontend API client for backend communication
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('donorToken') || localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token on auth error
      localStorage.removeItem('donorToken');
      localStorage.removeItem('adminToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============================================
// DONATION API
// ============================================

export interface DonationCreateData {
  quantity: number;
  email: string;
  name?: string;
  phone?: string;
  dedication?: string;
}

export interface DonationResponse {
  success: boolean;
  message: string;
  data: {
    donationId: number;
    quantity: number;
    amount: number;
    currency: string;
    orderId: string;
    razorpayKey: string;
    donor: {
      id: number;
      email: string;
      name?: string;
    };
  };
}

export interface PublicStats {
  success: boolean;
  data: {
    goal: number;
    remaining: number;
    sponsored: number;
    donors: number;
    raised: number;
    progress: number;
    hadithPrice: number;
    currency: string;
    totalFees: number;
    totalFeesCovered: number;
  };
}

export const donationApi = {
  // Create new donation
  create: async (data: DonationCreateData): Promise<DonationResponse> => {
    const response = await apiClient.post('/donations', data);
    return response.data;
  },

  // Get public stats
  getStats: async (): Promise<PublicStats> => {
    const response = await apiClient.get('/donations/stats/public');
    return response.data;
  },

  // Get donation by ID
  getById: async (id: number) => {
    const response = await apiClient.get(`/donations/${id}`);
    return response.data;
  },

  // Retry failed donation
  retry: async (id: number) => {
    const response = await apiClient.post(`/donations/${id}/retry`);
    return response.data;
  },
};

// ============================================
// PAYMENT API
// ============================================

export interface PaymentVerifyData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentConfig {
  pricePerHadith: number;
  feeCoverageEnabled: boolean;
  feePercentage: number;
  feeCoverageLabel: string;
  panEnabled: boolean;
  panRequired: boolean;
  razorpayKeyId: string;
}

export interface CreateOrderData {
  hadithCount: number;
  donorInfo: {
    email: string;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    panNumber?: string;
    isAnonymous?: boolean;
    message?: string;
  };
  coverFee?: boolean;
}

export interface CreateOrderResponse {
  success: boolean;
  order: {
    id: string;
    amount: number;
    currency: string;
  };
  amounts: {
    baseAmount: number;
    feeAmount: number;
    totalAmount: number;
    feePercentage: number;
    feeCovered: boolean;
  };
  donationId: number;
  keyId: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export const paymentApi = {
  // Get payment configuration
  getConfig: async (): Promise<{ success: boolean; config: PaymentConfig }> => {
    const response = await apiClient.get('/payments/config');
    return response.data;
  },

  // Create payment order
  createOrder: async (data: CreateOrderData): Promise<CreateOrderResponse> => {
    const response = await apiClient.post('/payments/create-order', data);
    return response.data;
  },

  // Verify payment
  verify: async (data: PaymentVerifyData) => {
    const response = await apiClient.post('/payments/verify', data);
    return response.data;
  },

  // Get payment status
  getStatus: async (orderId: string) => {
    const response = await apiClient.get(`/payments/status/${orderId}`);
    return response.data;
  },

  // Retry payment
  retry: async (donationId: number) => {
    const response = await apiClient.post('/payments/retry', { donationId });
    return response.data;
  },

  // Mark payment as failed
  markFailed: async (donationId: number, reason?: string) => {
    const response = await apiClient.post('/payments/failed', { donationId, reason });
    return response.data;
  },
};

// ============================================
// AUTH API
// ============================================

export const authApi = {
  // Request OTP
  requestOTP: async (email: string) => {
    const response = await apiClient.post('/auth/otp/request', { email });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email: string, otp: string) => {
    const response = await apiClient.post('/auth/otp/verify', { email, otp });
    return response.data;
  },

  // Request magic link
  requestMagicLink: async (email: string) => {
    const response = await apiClient.post('/auth/magic-link/request', { email });
    return response.data;
  },

  // Verify magic link
  verifyMagicLink: async (token: string) => {
    const response = await apiClient.post('/auth/magic-link/verify', { token });
    return response.data;
  },

  // Admin login
  adminLogin: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/admin/login', { email, password });
    return response.data;
  },
};

// ============================================
// DONOR API
// ============================================

export interface DonorProfile {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  panNumber?: string;
  isAnonymous: boolean;
  isVerified: boolean;
  totalDonations: number;
  totalAmount: number;
}

export interface DonorDonation {
  id: number;
  amount: number;
  baseAmount: number;
  feeAmount: number;
  feeCovered: boolean;
  hadithCount: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  completedAt?: string;
  panNumber?: string;
  receiptNumber?: string;
  receiptUrl?: string;
}

export const donorApi = {
  // Get profile
  getProfile: async (): Promise<{ success: boolean; donor: DonorProfile }> => {
    const response = await apiClient.get('/donors/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: { 
    name?: string; 
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    panNumber?: string;
  }) => {
    const response = await apiClient.put('/donors/profile', data);
    return response.data;
  },

  // Get donations
  getDonations: async (): Promise<{ success: boolean; donations: DonorDonation[]; pagination: any }> => {
    const response = await apiClient.get('/donors/donations');
    return response.data;
  },

  // Get dashboard
  getDashboard: async () => {
    const response = await apiClient.get('/donors/dashboard');
    return response.data;
  },
};

// ============================================
// ADMIN API
// ============================================

export interface DashboardStats {
  totalDonations: number;
  totalRaised: number;
  totalBaseAmount: number;
  totalFees: number;
  totalFeesCovered: number;
  totalDonors: number;
  hadithsSponsored: number;
  todayRaised: number;
  monthRaised: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  failedAmount: number;
  topDonors: Array<{
    id: number;
    name: string;
    email: string;
    totalDonated: number;
  }>;
  recentDonations: Array<{
    id: number;
    amount: number;
    baseAmount: number;
    feeAmount: number;
    feeCovered: boolean;
    hadithCount: number;
    status: string;
    createdAt: string;
    donorName: string;
    donorEmail: string;
  }>;
}

export interface AdminDonation {
  id: number;
  amount: number;
  baseAmount: number;
  feeAmount: number;
  feeCovered: boolean;
  hadithCount: number;
  status: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  panNumber?: string;
  createdAt: string;
  completedAt?: string;
  donor: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  receiptNumber?: string;
}

export const adminApi = {
  // Get dashboard stats
  getDashboard: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  // Get donations
  getDonations: async (params?: { status?: string; search?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/admin/donations', { params });
    return response.data;
  },

  // Get donation details
  getDonation: async (id: number): Promise<{ success: boolean; donation: AdminDonation }> => {
    const response = await apiClient.get(`/admin/donations/${id}`);
    return response.data;
  },

  // Update donation status
  updateDonation: async (id: number, data: { status: string; notes?: string }) => {
    const response = await apiClient.put(`/admin/donations/${id}`, data);
    return response.data;
  },

  // Resend receipt
  resendReceipt: async (id: number) => {
    const response = await apiClient.post(`/admin/donations/${id}/resend-receipt`);
    return response.data;
  },

  // Get donors
  getDonors: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/admin/donors', { params });
    return response.data;
  },

  // Get donor details
  getDonor: async (id: number) => {
    const response = await apiClient.get(`/admin/donors/${id}`);
    return response.data;
  },

  // Get all settings
  getAllSettings: async (): Promise<{ success: boolean; settings: Record<string, string> }> => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  // Get campaign settings
  getCampaignSettings: async () => {
    const response = await apiClient.get('/admin/settings/campaign');
    return response.data;
  },

  // Update campaign settings
  updateCampaignSettings: async (data: any) => {
    const response = await apiClient.put('/admin/settings/campaign', data);
    return response.data;
  },

  // Update any settings (superadmin only)
  updateSettings: async (data: Record<string, string>) => {
    const response = await apiClient.put('/admin/settings', data);
    return response.data;
  },

  // Export donations
  exportDonations: async (params?: { startDate?: string; endDate?: string; status?: string }) => {
    const response = await apiClient.get('/admin/export/donations', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Get logs
  getLogs: async (params?: { level?: string; category?: string; limit?: number }) => {
    const response = await apiClient.get('/admin/logs', { params });
    return response.data;
  },

  // Get admin users
  getAdminUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  // Get reports/analytics
  getReports: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/admin/reports', { params });
    return response.data;
  },
};

// ============================================
// SETUP API
// ============================================

export const setupApi = {
  // Check installation status
  getStatus: async () => {
    const response = await apiClient.get('/setup/status');
    return response.data;
  },

  // Test database connection
  testDatabase: async (data: {
    host: string;
    port: number;
    database: string;
    user: string;
    password?: string;
  }) => {
    const response = await apiClient.post('/setup/test-database', data);
    return response.data;
  },

  // Run installation
  install: async (data: any) => {
    const response = await apiClient.post('/setup/install', data);
    return response.data;
  },
};

export default apiClient;
