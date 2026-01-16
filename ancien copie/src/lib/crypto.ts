export function encryptPassword(password: string): string {
  return btoa(password);
}

export function decryptPassword(encrypted: string): string {
  try {
    return atob(encrypted);
  } catch {
    return 'ND';
  }
}

export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).toUpperCase()}`;
}
