export type RoleName = 'CUSTOMER' | 'BUSINESS_ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: RoleName;
  enabled: boolean;
  emailVerified: boolean;
  mobileVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterBusinessRequest {
  businessName: string;
  ownerName: string;
  gstNumber: string;
  email: string;
  mobile: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  mobileNumber: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
