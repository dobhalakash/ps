export type BusinessStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface BusinessProfile {
  id: number;
  userId: number;
  businessName: string;
  ownerName: string;
  gstNumber: string;
  upiId: string | null;
  bankAccountNumber: string | null;
  ifscCode: string | null;
  bankName: string | null;
  logoUrl?: string;
  accountHolderName: string | null;
  email: string;
  mobile: string;
  status: BusinessStatus;
}

export interface BusinessDashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCategoriesUsed: number;
  lowStockProducts: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalBusinessAccounts: number;
  pendingBusinessApprovals: number;
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalRevenue: number;
}

export interface BusinessApprovalRequest {
  status: BusinessStatus;
}

export interface UpdatePaymentSettingsRequest {
  upiId: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountHolderName?: string;
}
