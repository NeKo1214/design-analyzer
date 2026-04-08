/**
 * 简单混淆加密（非生产级，但比明文好）
 * 使用 btoa + 简单字符位移
 */
const CIPHER_KEY = 'da_';

const obfuscate = (str: string): string => {
  if (!str) return '';
  try {
    return btoa(
      encodeURIComponent(str)
        .split('')
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length) & 0x1f)))
        .join('')
    );
  } catch {
    return btoa(str);
  }
};

const deobfuscate = (str: string): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length) & 0x1f)))
        .join('')
    );
  } catch {
    // 兼容旧版明文存储
    try { return atob(str); } catch { return str; }
  }
};

export const secureStorage = {
  setItem(key: string, value: string) {
    localStorage.setItem(key, obfuscate(value));
  },
  getItem(key: string): string {
    return deobfuscate(localStorage.getItem(key) || '');
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
  }
};

export const STORAGE_KEYS = {
  API_KEY: 'da_apiKey',
  BASE_URL: 'da_baseUrl',
  MODEL: 'da_model',
  CUSTOM_BASE_URL: 'da_customBaseUrl',
  CUSTOM_MODEL_ID: 'da_customModelId',
} as const;