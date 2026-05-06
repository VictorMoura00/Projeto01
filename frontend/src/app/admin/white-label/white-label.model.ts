export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontFamily: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  isActive: boolean;
  theme: TenantTheme;
  createdAt: string;
}
