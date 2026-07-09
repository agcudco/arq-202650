export default () => ({
  port: process.env.PORT || 3005,

  services: {
    users: process.env.USERS_SERVICE_URL || 'http://localhost:8080',
    espacios: process.env.ESPACIOS_SERVICE_URL || 'http://localhost:8081',
    vehiculos: process.env.VEHICULOS_SERVICE_URL || 'http://localhost:3000',
    tickets: process.env.TICKETS_SERVICE_URL || 'http://localhost:3001',
    audit: process.env.AUDIT_SERVICE_URL || 'http://localhost:3002',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
});
