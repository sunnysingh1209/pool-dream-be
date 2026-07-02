export const ALLOWED_COIN_AMOUNTS = [25, 50, 100, 200, 500, 1000] as const;
export type CoinAmount = (typeof ALLOWED_COIN_AMOUNTS)[number];
