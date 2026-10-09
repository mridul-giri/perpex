import type { EnginePosition, LiquidatedUser } from "@perpex/types";
import { Users } from "../store/store";
import { insuranceFund } from "./insurance-fund";
import { PositionManager } from "./position-manager";
import type { EngineManager } from "./engine-manager";

export class LiquidationManager {
  private positionManager = new PositionManager();

  constructor(private readonly engineManager: EngineManager) {}

  async liquidateUnderwater(
    market: string,
    markPrice: bigint,
  ): Promise<LiquidatedUser[]> {
    const engine = this.engineManager.get(market);
    if (!engine) return [];

    const liquidated: LiquidatedUser[] = [];

    for (const user of Users.values()) {
      const position = user.positions.get(market);
      if (!position) continue;
      if (!this.isUnderwater(position, markPrice)) continue;

      const previewDeficit = this.deficitAtMark(position, markPrice);
      if (!insuranceFund.canCover(market, previewDeficit)) {
        console.log(
          `insurance fund cannot cover liquidation for user ${position.userId}; skipping`,
        );
        continue;
      }

      const { closed, bankruptcyPrice } = await engine.liquidatePosition(
        user,
        position,
        markPrice,
      );

      liquidated.push({
        userId: closed.userId,
        market: closed.market,
        quantity: closed.quantity,
        price: closed.exitPrice,
        liquidationPrice: closed.liquidationPrice,
        bankruptcyPrice,
      });
    }

    return liquidated;
  }

  private isUnderwater(position: EnginePosition, markPrice: bigint) {
    return position.side === "LONG"
      ? markPrice <= position.liquidationPrice
      : markPrice >= position.liquidationPrice;
  }

  private deficitAtMark(position: EnginePosition, markPrice: bigint) {
    const pnl = this.positionManager.calculateRealizedPnl(
      position,
      markPrice,
      position.quantity,
    );

    return position.margin + pnl < 0n ? -(position.margin + pnl) : 0n;
  }
}
