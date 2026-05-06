export interface UserSession {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  roles: string[];
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserSession;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
