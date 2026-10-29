import { INSURANCE_FUND_SEED, InsuranceFunds } from "../store/store";

export class InsuranceFund {
  seed(market: string, amount = INSURANCE_FUND_SEED) {
    InsuranceFunds.set(market, amount);
  }

  getFund(market: string) {
    return InsuranceFunds.get(market) ?? 0n;
  }

  canCover(market: string, amount: bigint) {
    return this.getFund(market) >= amount;
  }

  drawUpTo(market: string, amount: bigint) {
    const available = this.getFund(market);
    if (amount <= 0n || available <= 0n) return 0n;

    const drawn = amount < available ? amount : available;

    InsuranceFunds.set(market, available - drawn);
    return drawn;
  }

  exportState() {
    return Array.from(InsuranceFunds.entries());
  }

  importState(funds: [string, bigint][]) {
    InsuranceFunds.clear();
    for (const [market, balance] of funds) {
      InsuranceFunds.set(market, balance);
    }
  }
}

export const insuranceFund = new InsuranceFund();
