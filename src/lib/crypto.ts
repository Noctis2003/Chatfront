// lib/crypto.ts
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';

const SECRET = process.env.CHAT_GEN_SECRET!;

export function signUUID() {
  const uuid = randomUUID();
  const hash = createHmac('sha256', SECRET).update(uuid).digest('hex');
  // We return uuid.hash
  return `${uuid}.${hash}`;
}

export function verifyUUID(combinedToken: string) {
  try {
    const [uuid, hash] = combinedToken.split('.');
    if (!uuid || !hash) return false;

    const expectedHash = createHmac('sha256', SECRET).update(uuid).digest('hex');
    
    // Convert to buffers for a timing-safe comparison (prevents brute force)
    return timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  } catch {
    return false;
  }
}