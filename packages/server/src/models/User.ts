export interface IUser {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'manager' | 'cashier' | 'kitchen';
  active: number;
  created_at: string;
  updated_at: string;
}

export interface IUserPublic {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'kitchen';
  active: number;
  created_at: string;
  updated_at: string;
}

export interface IAuthPayload {
  userId: string;
  role: string;
}

export interface ILoginResponse {
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
}
