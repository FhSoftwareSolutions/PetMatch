/** Configuração do JWT (segredo e expiração), por ambiente. */
export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
};
