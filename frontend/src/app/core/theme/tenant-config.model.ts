export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontFamily: string;
}

export interface TenantConfig {
  slug: string;
  name: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  theme: TenantTheme;
}
