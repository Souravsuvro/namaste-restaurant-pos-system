import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';

const testDbPath = process.env.DATABASE_URL || path.resolve(__dirname, '../data/test.db');

describe('Auth', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pin TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier', 'kitchen')),
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Insert test user
    const hashedPin = bcrypt.hashSync('1234', 10);
    const userId = uuidv4();
    db.prepare('INSERT OR IGNORE INTO users (id, name, pin, role) VALUES (?, ?, ?, ?)').run(
      userId, 'Test Admin', hashedPin, 'admin'
    );
  });

  it('should verify a correct PIN with bcrypt', () => {
    const users = db.prepare('SELECT * FROM users WHERE active = 1').all() as { pin: string; name: string }[];

    let matched = false;
    for (const user of users) {
      if (bcrypt.compareSync('1234', user.pin)) {
        matched = true;
        expect(user.name).toBe('Test Admin');
        break;
      }
    }
    expect(matched).toBe(true);
  });

  it('should reject an incorrect PIN', () => {
    const users = db.prepare('SELECT * FROM users WHERE active = 1').all() as { pin: string }[];

    let matched = false;
    for (const user of users) {
      if (bcrypt.compareSync('9999', user.pin)) {
        matched = true;
        break;
      }
    }
    expect(matched).toBe(false);
  });

  it('should generate a valid JWT token', () => {
    const secret = process.env.JWT_SECRET || 'test-jwt-secret';
    const payload = { userId: 'test-id', role: 'admin' };

    const token = jwt.sign(payload, secret, { expiresIn: '8h' });
    expect(token).toBeTruthy();

    const decoded = jwt.verify(token, secret) as { userId: string; role: string };
    expect(decoded.userId).toBe('test-id');
    expect(decoded.role).toBe('admin');
  });

  it('should generate a valid refresh token', () => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
    const payload = { userId: 'test-id', role: 'admin' };

    const token = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });
    expect(token).toBeTruthy();

    const decoded = jwt.verify(token, refreshSecret) as { userId: string; role: string };
    expect(decoded.userId).toBe('test-id');
    expect(decoded.role).toBe('admin');
  });

  it('should reject an expired token', () => {
    const secret = process.env.JWT_SECRET || 'test-jwt-secret';
    const payload = { userId: 'test-id', role: 'admin' };

    const token = jwt.sign(payload, secret, { expiresIn: '0s' });

    expect(() => jwt.verify(token, secret)).toThrow();
  });

  it('should reject a token with wrong secret', () => {
    const payload = { userId: 'test-id', role: 'admin' };
    const token = jwt.sign(payload, 'correct-secret', { expiresIn: '8h' });

    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });

  it('should hash and verify PINs consistently', () => {
    const pin = '5678';
    const hash1 = bcrypt.hashSync(pin, 10);
    const hash2 = bcrypt.hashSync(pin, 10);

    // Different hashes (because of salt) but both should verify
    expect(hash1).not.toBe(hash2);
    expect(bcrypt.compareSync(pin, hash1)).toBe(true);
    expect(bcrypt.compareSync(pin, hash2)).toBe(true);
  });
});
