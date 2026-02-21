export const getJwtConfig = () => ({
  secret: process.env.JWT_SECRET || 'ast-dev-secret-change-in-production',
  expiration: process.env.JWT_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
});
