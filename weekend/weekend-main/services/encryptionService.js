const crypto = require("crypto");
const argon2 = require("argon2");

// Load keys from environment variables
const KEYS = {
  "1": process.env.MONGODB_ENCRYPTION_KEY_V1 || process.env.MONGODB_ENCRYPTION_KEY,
};

const CURRENT_KEY_ID = "1";
const ALGORITHM = "aes-256-gcm";

// Ensure the key exists and is of correct length (32 bytes)
const getKey = (keyId) => {
  const rawKey = KEYS[keyId];
  if (!rawKey) {
    throw new Error(`Encryption key with ID "${keyId}" not found in env.`);
  }
  const key = Buffer.from(rawKey, "hex");
  if (key.length !== 32) {
    throw new Error(`Encryption key "${keyId}" must be exactly 32 bytes (64 hex characters).`);
  }
  return key;
};

// HMAC key for blind index (searchable fields)
const getHmacKey = () => {
  const rawHmacKey = process.env.LOOKUP_HMAC_KEY;
  if (!rawHmacKey) {
    throw new Error("LOOKUP_HMAC_KEY environment variable is required for searchable encrypted fields.");
  }
  const key = Buffer.from(rawHmacKey, "hex");
  if (key.length < 32) {
    throw new Error("LOOKUP_HMAC_KEY must be at least 32 bytes (64 hex characters) long.");
  }
  return key;
};

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns an envelope object.
 */
const encrypt = (plaintext, keyId = CURRENT_KEY_ID) => {
  if (plaintext === null || plaintext === undefined) {
    return plaintext;
  }
  
  // If it's already an envelope, don't encrypt again
  if (typeof plaintext === "object" && plaintext.algorithm === "AES-256-GCM" && plaintext.ciphertext) {
    return plaintext;
  }

  const textToEncrypt = typeof plaintext === "object" ? JSON.stringify(plaintext) : String(plaintext);
  
  const key = getKey(keyId);
  const iv = crypto.randomBytes(12); // 12 bytes IV is standard for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(textToEncrypt, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  
  return {
    version: 1,
    algorithm: "AES-256-GCM",
    keyId: keyId,
    iv: iv.toString("hex"),
    ciphertext: ciphertext,
    authTag: authTag
  };
};

/**
 * Decrypts an envelope object.
 */
const decrypt = (envelope) => {
  if (!envelope || typeof envelope !== "object") {
    return envelope;
  }
  
  // If it's not our envelope format, return it as-is (e.g. legacy or unencrypted data)
  if (!envelope.algorithm || envelope.algorithm !== "AES-256-GCM" || !envelope.ciphertext) {
    return envelope;
  }
  
  const { keyId, iv, ciphertext, authTag } = envelope;
  if (!keyId || !iv || !ciphertext || !authTag) {
    throw new Error("Invalid encryption envelope format.");
  }
  
  const key = getKey(keyId);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  // Try parsing as JSON if it was serialized object/array
  try {
    return JSON.parse(decrypted);
  } catch (e) {
    return decrypted;
  }
};

/**
 * Generates a deterministic lookup token (HMAC-SHA256) of normalized input.
 */
const generateLookupToken = (text) => {
  if (text === null || text === undefined || text === "") return text;
  // Normalize: lowercase, trim, and strip spaces/dashes if it is a phone number
  let normalized = String(text).trim().toLowerCase();
  
  // Check if it looks like a phone number to strip formatting
  if (/^\+?[0-9\s\-()]+$/.test(normalized)) {
    normalized = normalized.replace(/[\s\-()]/g, "");
  }

  const key = getHmacKey();
  return crypto.createHmac("sha256", key).update(normalized).digest("hex");
};

/**
 * Hashes a password using Argon2id.
 */
const hashPassword = async (password) => {
  if (!password) return password;
  return await argon2.hash(password, { type: argon2.argon2id });
};

/**
 * Verifies a password against an Argon2id hash, with legacy plaintext fallback.
 */
const verifyPassword = async (hash, password) => {
  if (!hash || !password) return false;
  if (typeof hash !== "string") return false;
  
  // Fallback for legacy plaintext password
  if (!hash.startsWith("$argon2")) {
    return hash === password;
  }
  
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    return false;
  }
};

/**
 * Recursively scans and transforms query filter criteria
 * replacing 'email' and 'phone' fields with their blind index lookup tokens.
 */
const transformQuery = (query) => {
  if (!query || typeof query !== 'object') return;
  
  if (Array.isArray(query)) {
    query.forEach(item => transformQuery(item));
    return;
  }
  
  for (const key in query) {
    if (key === 'email') {
      const val = query[key];
      if (typeof val === 'string') {
        query.emailLookupToken = generateLookupToken(val);
        delete query.email;
      } else if (val && typeof val === 'object') {
        if (val.$in && Array.isArray(val.$in)) {
          query.emailLookupToken = { $in: val.$in.map(v => generateLookupToken(v)) };
          delete query.email;
        }
      }
    } else if (key === 'phone') {
      const val = query[key];
      if (typeof val === 'string') {
        query.phoneLookupToken = generateLookupToken(val);
        delete query.phone;
      } else if (val && typeof val === 'object') {
        if (val.$in && Array.isArray(val.$in)) {
          query.phoneLookupToken = { $in: val.$in.map(v => generateLookupToken(v)) };
          delete query.phone;
        }
      }
    } else if (typeof query[key] === 'object') {
      transformQuery(query[key]);
    }
  }
};

module.exports = {
  encrypt,
  decrypt,
  generateLookupToken,
  hashPassword,
  verifyPassword,
  transformQuery
};
