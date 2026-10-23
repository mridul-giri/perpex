export const MAX_FUNDING_RATE_BPS = 1n;

export const fundingRateBps = (
  indexPrice: bigint,
  markPrice: bigint,
): bigint => {
  if (indexPrice <= 0n) return 0n;

  const premiumBps = ((markPrice - indexPrice) * 10000n) / indexPrice;
  if (premiumBps > MAX_FUNDING_RATE_BPS) return MAX_FUNDING_RATE_BPS;
  if (premiumBps < -MAX_FUNDING_RATE_BPS) return -MAX_FUNDING_RATE_BPS;
  return premiumBps;
};
