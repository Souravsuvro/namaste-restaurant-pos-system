import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || path.resolve(__dirname, '../../data/pos.db'),
  jwt: {
    secret: process.env.JWT_SECRET || 'namaste-pos-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'namaste-pos-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  taxRate: parseFloat(process.env.TAX_RATE || '0.10'),
  currency: process.env.CURRENCY || 'EUR',
  currencySymbol: process.env.CURRENCY_SYMBOL || '\u20ac',
  restaurant: {
    name: process.env.RESTAURANT_NAME || 'Namaste GIEN',
    address: process.env.RESTAURANT_ADDRESS || '1 Rue de la R\u00e9publique, 45500 Gien, France',
    phone: process.env.RESTAURANT_PHONE || '+33 2 38 00 00 00',
    email: process.env.RESTAURANT_EMAIL || 'contact@namaste-gien.fr',
    vatNumber: process.env.RESTAURANT_VAT || 'FR00123456789',
  },
} as const;

export type Config = typeof config;
