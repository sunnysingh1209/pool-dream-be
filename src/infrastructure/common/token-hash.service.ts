import { createHash, randomBytes } from 'crypto';

export class TokenHashService {
    static generateOpaqueToken(): string {
        return randomBytes(64).toString('hex');
    }

    static hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
