import { INSURANCE_FUND_SEED } from "../store/store";

export class InsuranceFund {
  private funds = new Map<string, bigint>();

  seed(market: string) {
    this.funds.set(market, INSURANCE_FUND_SEED);
  }

  addToFund(market: string, amount: bigint) {
    this.funds.set(market, this.getFund(market) + amount);
  }

  getFund(market: string) {
    return this.funds.get(market) ?? 0n;
  }

  canCover(market: string, amount: bigint) {
    return this.getFund(market) >= amount;
  }

  coverDeficit(market: string, amount: bigint): boolean {
    if (amount <= 0n) return true;

    const fund = this.getFund(market);
    if (fund < amount) return false;

    this.funds.set(market, fund - amount);
    return true;
  }
}

export const insuranceFund = new InsuranceFund();
