interface AttemptRecord {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const attempts = new Map<string, AttemptRecord>();
const ATTEMPT_WINDOW = 60000;
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 300000;

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn?: number } {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record) {
    attempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((record.blockedUntil - now) / 1000)
    };
  }

  if (now - record.lastAttempt > ATTEMPT_WINDOW) {
    attempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION;
    attempts.set(identifier, record);
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil(BLOCK_DURATION / 1000)
    };
  }

  record.count++;
  record.lastAttempt = now;
  attempts.set(identifier, record);

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - record.count
  };
}

export function resetRateLimit(identifier: string): void {
  attempts.delete(identifier);
}
