const surnames = [
  'ARCHER', 'BISHOP', 'CARTER', 'DRAKE', 'FROST',
  'GRANT', 'HAWKS', 'IRON', 'KANE', 'LYNCH',
  'MASON', 'NASH', 'OWENS', 'PIKE', 'Quinn',
  'RAVEN', 'STONE', 'THORN', 'VANCE', 'WOLF',
  'CIPHER', 'SHADOW', 'GHOST', 'VIPER', 'COBRA',
  'FALCON', 'PHOENIX', 'TITAN', 'NEXUS', 'OMEGA'
];

export function generateCodeName(): string {
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const number = Math.floor(Math.random() * 900) + 100;
  return `${surname}-${number}`;
}

export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyCode(inputCode: string, hashedCode: string): Promise<boolean> {
  const inputHash = await hashCode(inputCode);
  return inputHash === hashedCode;
}
