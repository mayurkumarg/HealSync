import crypto from 'crypto';

/**
 * Encryption Service using AES-256-GCM with SHA-256 derived keys
 * Provides secure encryption/decryption for sensitive medical data
 */

// Get encryption key from environment or generate secure default
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Derives a secure encryption key from a password using SHA-256 and PBKDF2
 * @param {string} password - Password to derive key from
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(
    password,
    salt,
    100000, // iterations
    32, // key length
    'sha256'
  );
}

/**
 * Creates a SHA-256 hash of the input data
 * Used for data integrity verification
 * @param {string} data - Data to hash
 * @returns {string} Hex encoded hash
 */
export function createHash(data) {
  return crypto
    .createHash('sha256')
    .update(String(data))
    .digest('hex');
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param {any} data - Data to encrypt (will be JSON stringified if object)
 * @param {string} key - Optional custom encryption key (uses env key if not provided)
 * @returns {string} Encrypted data in format: iv:authTag:encryptedData:salt (if custom key)
 */
export function encrypt(data, key = null) {
  try {
    // Convert data to string if it's an object
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    let encryptionKey = ENCRYPTION_KEY;
    let salt = null;

    // If custom key provided, derive it using PBKDF2 with SHA-256
    if (key) {
      salt = crypto.randomBytes(SALT_LENGTH);
      encryptionKey = deriveKey(key, salt);
    }

    // Generate random IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, authTag, encrypted data, and salt (if exists)
    const result = [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted
    ];

    if (salt) {
      result.push(salt.toString('hex'));
    }

    return result.join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data encrypted with encrypt()
 * @param {string} encryptedData - Encrypted data string
 * @param {string} key - Optional custom encryption key (must match encryption key)
 * @returns {any} Decrypted data (parsed as JSON if possible)
 */
export function decrypt(encryptedData, key = null) {
  try {
    if (!encryptedData) {
      throw new Error('No data to decrypt');
    }

    // Split the encrypted data
    const parts = encryptedData.split(':');
    
    if (parts.length < 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const salt = parts[3] ? Buffer.from(parts[3], 'hex') : null;

    let decryptionKey = ENCRYPTION_KEY;

    // If salt exists, derive key from custom password
    if (salt && key) {
      decryptionKey = deriveKey(key, salt);
    } else if (salt && !key) {
      throw new Error('Custom key required for decryption');
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, decryptionKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Try to parse as JSON, return string if parsing fails
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypts medical record data fields selectively
 * @param {Object} recordData - Medical record data object
 * @param {Array} sensitiveFields - Array of field names to encrypt
 * @returns {Object} Record with encrypted sensitive fields
 */
export function encryptMedicalRecord(recordData, sensitiveFields = []) {
  const encrypted = { ...recordData };
  const defaultSensitiveFields = [
    'bloodPressure',
    'heartRate',
    'temperature',
    'weight',
    'height',
    'bloodSugar',
    'diagnosis',
    'prescription',
    'notes',
    'symptoms',
    'allergies',
    'medications',
    'medicalHistory'
  ];

  const fieldsToEncrypt = sensitiveFields.length > 0 ? sensitiveFields : defaultSensitiveFields;

  fieldsToEncrypt.forEach(field => {
    if (encrypted[field] !== undefined && encrypted[field] !== null && encrypted[field] !== '') {
      encrypted[field] = encrypt(encrypted[field]);
      // Mark field as encrypted
      encrypted[`${field}_encrypted`] = true;
    }
  });

  // Create integrity hash of the entire record
  encrypted._integrity = createHash(JSON.stringify(encrypted));

  return encrypted;
}

/**
 * Decrypts medical record data fields
 * @param {Object} encryptedRecord - Medical record with encrypted fields
 * @returns {Object} Record with decrypted fields
 */
export function decryptMedicalRecord(encryptedRecord) {
  const decrypted = { ...encryptedRecord };

  Object.keys(decrypted).forEach(key => {
    // Check if field is marked as encrypted
    if (decrypted[`${key}_encrypted`]) {
      try {
        decrypted[key] = decrypt(decrypted[key]);
        delete decrypted[`${key}_encrypted`];
      } catch (error) {
        console.error(`Failed to decrypt field ${key}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  });

  // Verify integrity if hash exists
  const integrityHash = decrypted._integrity;
  delete decrypted._integrity;

  if (integrityHash) {
    const calculatedHash = createHash(JSON.stringify(decrypted));
    if (calculatedHash !== integrityHash) {
      console.warn('Data integrity check failed - data may have been tampered with');
    }
  }

  return decrypted;
}

/**
 * Verifies data integrity using SHA-256 hash
 * @param {any} data - Data to verify
 * @param {string} hash - Expected hash
 * @returns {boolean} True if integrity is valid
 */
export function verifyIntegrity(data, hash) {
  const calculatedHash = createHash(data);
  return calculatedHash === hash;
}

/**
 * Generates a secure token using SHA-256
 * @returns {string} Secure random token
 */
export function generateSecureToken() {
  const randomBytes = crypto.randomBytes(32);
  return createHash(randomBytes);
}

/**
 * Encrypts sensitive user credentials
 * @param {Object} credentials - Credentials object
 * @returns {Object} Encrypted credentials
 */
export function encryptCredentials(credentials) {
  const encrypted = {};
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'biometricToken'];

  Object.keys(credentials).forEach(key => {
    if (sensitiveFields.includes(key) && credentials[key]) {
      encrypted[key] = encrypt(credentials[key]);
      encrypted[`${key}_encrypted`] = true;
    } else {
      encrypted[key] = credentials[key];
    }
  });

  return encrypted;
}

/**
 * Decrypts sensitive user credentials
 * @param {Object} encryptedCredentials - Encrypted credentials object
 * @returns {Object} Decrypted credentials
 */
export function decryptCredentials(encryptedCredentials) {
  const decrypted = { ...encryptedCredentials };

  Object.keys(decrypted).forEach(key => {
    if (decrypted[`${key}_encrypted`]) {
      try {
        decrypted[key] = decrypt(decrypted[key]);
        delete decrypted[`${key}_encrypted`];
      } catch (error) {
        console.error(`Failed to decrypt credential ${key}:`, error);
      }
    }
  });

  return decrypted;
}

export default {
  encrypt,
  decrypt,
  createHash,
  encryptMedicalRecord,
  decryptMedicalRecord,
  verifyIntegrity,
  generateSecureToken,
  encryptCredentials,
  decryptCredentials
};
