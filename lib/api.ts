import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jehovah-nissi-pretoleum-backend.onrender.com';

// Créer une instance axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  role: 'user' | 'admin' | 'gestion';
  managedStationId?: string;
  isKycVerified: boolean;
  isActive: boolean;
  walletBalance: number;
  createdAt: string;
}

export interface KycRequest {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  documentType: string;
  documentNumber: string;
  documentPhoto: string;
  documentBackPhoto?: string;
  selfiePhoto?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface Transaction {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reference: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund';
  amount: number;
  provider?: 'mtn' | 'moov' | 'celtiis';
  phoneNumber?: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED';
  feexpayReference?: string;
  errorMessage?: string;
  reason?: string;
  description?: string;
  metadata?: any;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API
export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('admin_token', response.data.token);
      }
      return response.data;
    },
    logout: () => {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    },
  },

  // Users
  users: {
    getAll: async (): Promise<User[]> => {
      const response = await apiClient.get('/users');
      return response.data;
    },
    getById: async (id: string): Promise<User> => {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    },
    updateRole: async (id: string, role: string) => {
      const response = await apiClient.patch(`/users/${id}/role`, { role });
      return response.data;
    },
    toggleActive: async (id: string, isActive: boolean) => {
      const response = await apiClient.patch(`/users/${id}/active`, { isActive });
      return response.data;
    },
    assignStation: async (id: string, stationId: string) => {
      const response = await apiClient.patch(`/users/${id}/assign-station`, { stationId });
      return response.data;
    },
    searchUsers: async (query: string): Promise<User[]> => {
      const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response.data;
    },
  },

  // KYC
  kyc: {
    getAll: async (): Promise<KycRequest[]> => {
      const response = await apiClient.get('/kyc/pending');
      return response.data;
    },
    getById: async (id: string): Promise<KycRequest> => {
      const response = await apiClient.get(`/kyc/${id}`);
      return response.data;
    },
    review: async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
      const response = await apiClient.put(`/kyc/${id}/review`, {
        status,
        rejectionReason,
      });
      return response.data;
    },
  },

  // Stations
  stations: {
    getAll: async () => {
      const response = await apiClient.get('/stations');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/stations/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await apiClient.post('/stations', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await apiClient.put(`/stations/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/stations/${id}`);
      return response.data;
    },
    search: async (query: string) => {
      const response = await apiClient.get(`/stations/search?q=${query}`);
      return response.data;
    },
    getStats: async () => {
      const response = await apiClient.get('/stations/stats');
      return response.data;
    },
    uploadPhotos: async (stationId: string, formData: FormData) => {
      const response = await apiClient.post(`/stations/${stationId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  },

  // Reservations
  reservations: {
    getAll: async (stationId?: string, status?: string) => {
      let url = '/reservations/all';
      const params = new URLSearchParams();
      if (stationId) params.append('stationId', stationId);
      if (status) params.append('status', status);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await apiClient.get(url);
      return response.data;
    },
    getMyReservations: async (status?: string) => {
      let url = '/reservations/my-reservations';
      if (status) url += `?status=${status}`;
      const response = await apiClient.get(url);
      return response.data;
    },
    getByReference: async (reference: string) => {
      const response = await apiClient.get(`/reservations/${reference}`);
      return response.data;
    },
    cancel: async (reference: string, reason?: string) => {
      const response = await apiClient.post(`/reservations/${reference}/cancel`, { reason });
      return response.data;
    },
  },

  // Transactions
  transactions: {
    getAll: async (page?: number, limit?: number): Promise<PaginatedTransactions> => {
      let url = '/payments/admin/transactions';
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (params.toString()) url += `?${params.toString()}`;
      const response = await apiClient.get(url);
      return response.data;
    },
    getById: async (id: string): Promise<Transaction> => {
      const response = await apiClient.get(`/payments/admin/transactions/${id}`);
      return response.data;
    },
    getStats: async () => {
      const response = await apiClient.get('/payments/admin/stats');
      return response.data;
    },
  },

  payments: {
    refundUser: async (userId: string, amount: number, reason: string) => {
      const response = await apiClient.post('/payments/admin/refund', {
        userId,
        amount,
        reason,
      });
      return { data: response.data, error: null };
    },
  },

  // Notifications
  notifications: {
    send: async (userId: string, payload: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' | 'marketing'; data?: any }) => {
      const response = await apiClient.post('/notifications/send', { userId, payload });
      return response.data;
    },
    sendBulk: async (userIds: string[], payload: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' | 'marketing'; data?: any }) => {
      const response = await apiClient.post('/notifications/send-bulk', { userIds, payload });
      return response.data;
    },
    marketingCampaign: async (payload: { title: string; message: string; type?: 'marketing'; data?: any }) => {
      const response = await apiClient.post('/notifications/marketing-campaign', { ...payload, type: 'marketing' });
      return response.data;
    },
  },
};

export default api;
