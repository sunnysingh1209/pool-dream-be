/**
 * Payout multiplier applied to every winning GameBetNumberTbl row (direct or
 * Ander/Bahar). Ander/Bahar's lower effective odds are already baked into the
 * per-number amount stored at placeBet time (its group stake is split across
 * 10 numbers), so a single multiplier applies uniformly here.
 */
export const JODI_PAYOUT_MULTIPLIER = 95;
