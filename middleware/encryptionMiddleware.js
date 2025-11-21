import { encryptMedicalRecord, decryptMedicalRecord, verifyIntegrity } from '../utils/encryption.js';

/**
 * Middleware to encrypt medical record data in request body
 */
export const encryptMedicalData = (req, res, next) => {
  try {
    if (req.body.data && typeof req.body.data === 'object') {
      const encrypted = encryptMedicalRecord(req.body.data);
      req.body.data = encrypted;
      req.body._encrypted = true;
      console.log('[ENCRYPTION] Medical data encrypted');
    }
    next();
  } catch (error) {
    console.error('[ENCRYPTION] Failed to encrypt medical data:', error);
    // Continue without encryption on error
    next();
  }
};

/**
 * Middleware to decrypt medical record data in response
 */
export const decryptMedicalData = (data) => {
  try {
    if (data && data._encrypted) {
      return decryptMedicalRecord(data);
    }
    return data;
  } catch (error) {
    console.error('[DECRYPTION] Failed to decrypt medical data:', error);
    return data;
  }
};

/**
 * Middleware to verify data integrity
 */
export const verifyDataIntegrity = (req, res, next) => {
  try {
    if (req.body._integrity && req.body.data) {
      const isValid = verifyIntegrity(req.body.data, req.body._integrity);
      if (!isValid) {
        console.warn('[INTEGRITY] Data integrity verification failed');
        return res.status(400).json({
          status: 'failed',
          message: 'Data integrity verification failed. Data may have been tampered with.'
        });
      }
      console.log('[INTEGRITY] Data integrity verified');
    }
    next();
  } catch (error) {
    console.error('[INTEGRITY] Integrity verification error:', error);
    next();
  }
};

/**
 * Sanitize sensitive data from logs
 */
export const sanitizeSensitiveData = (data) => {
  const sensitive = ['password', 'token', 'biometricToken', 'apiKey', 'secret'];
  const sanitized = { ...data };
  
  sensitive.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
};

export default {
  encryptMedicalData,
  decryptMedicalData,
  verifyDataIntegrity,
  sanitizeSensitiveData
};
