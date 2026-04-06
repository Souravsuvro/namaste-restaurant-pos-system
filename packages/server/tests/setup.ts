import { beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';

// Use a test database
const testDbPath = path.resolve(__dirname, '../data/test.db');

// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDbPath;
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.PORT = '3099';

beforeAll(() => {
  // Ensure the data directory exists
  const dataDir = path.dirname(testDbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Remove test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

afterAll(() => {
  // Clean up test database
  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  } catch {
    // Ignore cleanup errors
  }
});
