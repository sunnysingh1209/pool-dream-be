import { Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cross-site (FE and BE on different eTLDs, e.g. vercel.app / onrender.com)
 * requires SameSite=None + Secure. Once both sides share a root domain
 * (api.example.com / app.example.com), switch this to 'lax' and set
 * COOKIE_DOMAIN=.example.com for a same-site, less CSRF-exposed cookie.
 *
 * `partitioned` (CHIPS) is required alongside SameSite=None for the cookie
 * to survive Chrome's third-party-cookie phase-out — without it, Chrome
 * silently drops the cookie on cross-site requests even though it's stored,
 * which is what caused sessions not to survive a refresh.
 */
function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    partitioned: isProduction,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/api/v1/auth',
  };
}

export function setRefreshTokenCookie(
  response: Response,
  token: string,
  maxAgeMs: number,
): void {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(response: Response): void {
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions());
}
