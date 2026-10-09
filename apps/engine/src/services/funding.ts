import type { OrderSide } from "@perpex/types";
import { Users } from "../store/store";
import { SCALE } from "../utils/conversion";
import { insuranceFund } from "./insurance-fund";
import { PositionManager } from "./position-manager";

export interface FundingResult {
  rateBps: bigint;
  payments: number;
  usedInsuranceFund: bigint;
}

const BASIS_POINTS = 10000n;

export class FundingManager {
  private positionManager = new PositionManager();

  settle(market: string, rateBps: bigint): FundingResult {
    let payments = 0;
    let usedInsuranceFund = 0n;

    if (rateBps === 0n) {
      return { rateBps, payments, usedInsuranceFund };
    }

    const payerSide: OrderSide = rateBps > 0n ? "LONG" : "SHORT";
    const absoluteRate = rateBps < 0n ? -rateBps : rateBps;

    for (const user of Users.values()) {
      const position = user.positions.get(market);
      if (!position) continue;

      const amount =
        (position.averagePrice * position.quantity * absoluteRate) /
        (SCALE * BASIS_POINTS);

      if (amount === 0n) continue;

      if (position.side === payerSide) {
        const deducted = amount < position.margin ? amount : position.margin;
        const deficit = amount - deducted;

        position.margin -= deducted;
        user.collateral.lockedBalance -= deducted;

        if (deficit > 0n) {
          usedInsuranceFund += this.coverDeficit(market, deficit);
        }
      } else {
        position.margin += amount;
        user.collateral.lockedBalance += amount;
      }

      this.positionManager.updateLiquidationPrice(position);
      payments++;
    }

    return { rateBps, payments, usedInsuranceFund };
  }

  private coverDeficit(market: string, deficit: bigint) {
    if (insuranceFund.coverDeficit(market, deficit)) {
      return deficit;
    }

    const available = insuranceFund.getFund(market);
    insuranceFund.coverDeficit(market, available);
    return available;
  }
}
