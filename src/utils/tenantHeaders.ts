export type TenantType = 'demo_ecommerce' | 'demo_movies';

export const getTenantHeaders = (tenantType: TenantType): Record<string, string> => {
  const baseHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy-auth-token'
  };

  switch (tenantType) {
    case 'demo_ecommerce':
      return {
        ...baseHeaders,
        'tenant': 'demo_ecommerce'
      };
    case 'demo_movies':
      return {
        ...baseHeaders,
        'tenant': 'demo_movies'
      };
    default:
      return baseHeaders;
  }
};

// Helper function to determine tenant type from current path
export const getTenantTypeFromPath = (pathname: string): TenantType => {
  if (pathname.includes('/demo_ecommerce')) {
    return 'demo_ecommerce';
  } else if (pathname.includes('/demo_site')) {
    return 'demo_movies';
  }
  // Default to demo_movies for backward compatibility
  return 'demo_ecommerce';
};

// Helper function to get tenant headers based on current location
export const getTenantHeadersFromPath = (pathname: string): Record<string, string> => {
  const tenantType = getTenantTypeFromPath(pathname);
  return getTenantHeaders(tenantType);
}; 