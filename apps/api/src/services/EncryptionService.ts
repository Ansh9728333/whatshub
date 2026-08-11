import crypto from 'crypto';
import { logger } from '../config/logger.js';

const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
  private static getKey(): Buffer {
    const rawKey = process.env.SESSION_ENCRYPTION_KEY || 'default_32_byte_secret_key_whatshub_prod!';
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  public static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const key = this.getKey();
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err: any) {
      logger.error('Encryption failure:', err.message);
      throw new Error('Failed to encrypt session state credentials.');
    }
  }

  public static decrypt(cipherText: string): string {
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format.');
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = this.getKey();

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      logger.error('Decryption failure:', err.message);
      throw new Error('Failed to decrypt session state credentials.');
    }
  }
}
