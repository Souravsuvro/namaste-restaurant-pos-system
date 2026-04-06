export type UserRole = 'admin' | 'manager' | 'cashier' | 'kitchen';

export interface User {
  id: string;
  name: string;
  pin?: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface CreateUserPayload {
  name: string;
  pin: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  pin?: string;
  role?: UserRole;
  active?: boolean;
}
