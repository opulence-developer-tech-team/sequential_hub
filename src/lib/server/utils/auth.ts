import crypto from "crypto";

// Production-ready password hashing configuration
const HASH_CONFIG = {
  saltLength: 32, // 32 bytes = 256 bits (very secure)
  iterations: 100000, // OWASP recommended for 2024
  keyLength: 64, // 64 bytes = 512 bits
  algorithm: 'sha512' as const
};

export const hashPassCode = (password: string) => {
  return new Promise((resolve, reject) => {
    try {
      // Generate a cryptographically secure random salt
      const salt = crypto.randomBytes(HASH_CONFIG.saltLength).toString('hex');
      
      // Hash the password with high iteration count
      const hash = crypto.pbkdf2Sync(
        password, 
        salt, 
        HASH_CONFIG.iterations, 
        HASH_CONFIG.keyLength, 
        HASH_CONFIG.algorithm
      ).toString('hex');
      
      // Combine salt and hash with version info for future upgrades
      const hashedPassword = `v1:${salt}:${hash}`;
      resolve(hashedPassword);
    } catch (error) {
      reject(error);
    }
  });
};

export const comparePassCode = (password: string, hashed: string) => {
  try {
    // Split the hashed password to get version, salt and hash
    const [version, salt, hash] = hashed.split(':');
    
    // Support for future version upgrades
    if (version !== 'v1') {
      throw new Error('Unsupported hash version');
    }
    
    // Hash the input password with the same parameters
    const inputHash = crypto.pbkdf2Sync(
      password, 
      salt, 
      HASH_CONFIG.iterations, 
      HASH_CONFIG.keyLength, 
      HASH_CONFIG.algorithm
    ).toString('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'), 
      Buffer.from(inputHash, 'hex')
    );
  } catch (error) {
    return false;
  }
};
