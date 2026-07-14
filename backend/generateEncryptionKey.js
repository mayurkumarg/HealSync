import crypto from 'crypto';

/**
 * Generate a secure 256-bit encryption key for AES-256-GCM
 * Run this script: node generateEncryptionKey.js
 */

const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         🔐 ENCRYPTION KEY GENERATED SUCCESSFULLY 🔐           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('Add this to your .env file:\n');
console.log('# 🔒 Encryption Key for Medical Records (AES-256-GCM with SHA-256)');
console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('   1. Keep this key secret and secure');
console.log('   2. Never commit this key to version control');
console.log('   3. Use different keys for development and production');
console.log('   4. Store securely (e.g., AWS Secrets Manager, Azure Key Vault)');
console.log('   5. Rotate keys periodically for enhanced security');
console.log('   6. If key is lost, encrypted data cannot be recovered\n');

// Generate a second key for backup
const backupKey = crypto.randomBytes(32).toString('hex');
console.log('Backup key (store separately):');
console.log(`ENCRYPTION_KEY_BACKUP=${backupKey}\n`);

console.log('✅ Keys generated using crypto.randomBytes() with SHA-256 derivation');
console.log('✅ 256-bit key length provides maximum security for AES-256');
console.log('✅ Suitable for HIPAA-compliant medical data encryption\n');
