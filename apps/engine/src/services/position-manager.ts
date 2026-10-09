import type {
  EngineClosedPosition,
  EngineFill,
  EnginePayload,
  EnginePosition,
  EngineUser,
  OrderSide,
} from "@perpex/types";
import { maintenanceMarginRate } from "../store/store";
import { SCALE, toBigInt } from "../utils/conversion";

export class PositionManager {
  applyFill(
    user: EngineUser,
    payload: EnginePayload,
    fill: EngineFill,
    fillMargin: bigint,
  ): EngineClosedPosition | null {
    const position = user.positions.get(payload.market);

    if (!position) {
      this.openPosition(user, payload, fill, fillMargin);
      return null;
    }

    if (position.side === payload.side) {
      this.increasePosition(position, payload, fill, fillMargin);
      return null;
    }

    if (fill.quantity < position.quantity) {
      this.reducePosition(user, position, payload, fill, fillMargin);
      return null;
    }

    if (fill.quantity === position.quantity) {
      return this.closePosition(user, position, payload, fill, fillMargin);
    }

    return this.flipPosition(user, position, payload, fill, fillMargin);
  }

  private openPosition(
    user: EngineUser,
    payload: EnginePayload,
    fill: EngineFill,
    fillMargin: bigint,
  ) {
    const position: EnginePosition = {
      userId: payload.userId,
      market: payload.market,
      side: payload.side,
      quantity: fill.quantity,
      averagePrice: fill.price,
      margin: fillMargin,
      liquidationPrice: this.calculateLiquidationPrice(
        payload.side,
        fill.price,
        payload.leverage,
      ),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    user.positions.set(payload.market, position);
  }

  private increasePosition(
    position: EnginePosition,
    payload: EnginePayload,
    fill: EngineFill,
    fillMargin: bigint,
  ) {
    const newQuantity = position.quantity + fill.quantity;

    position.averagePrice =
      (position.averagePrice * position.quantity + fill.price * fill.quantity) /
      newQuantity;
    position.quantity = newQuantity;
    position.margin += fillMargin;
    position.liquidationPrice = this.calculateLiquidationPrice(
      position.side,
      position.averagePrice,
      payload.leverage,
    );
    position.updatedAt = Date.now();
  }

  private reducePosition(
    user: EngineUser,
    position: EnginePosition,
    payload: EnginePayload,
    fill: EngineFill,
    fillMargin: bigint,
  ) {
    const releasedMargin =
      (position.margin * fill.quantity) / position.quantity;
    const pnl = this.calculateRealizedPnl(position, fill.price, fill.quantity);

    this.settle(user, releasedMargin + fillMargin, pnl);

    position.quantity -= fill.quantity;
    position.margin -= releasedMargin;
    position.liquidationPrice = this.calculateLiquidationPrice(
      position.side,
      position.averagePrice,
      payload.leverage,
    );
    position.updatedAt = Date.now();
  }

  private closePosition(
    user: EngineUser,
    position: EnginePosition,
    payload: EnginePayload,
    fill: EngineFill,
    fillMargin: bigint,
  ): EngineClosedPosition {
    const pnl = this.calculateRealizedPnl(
      position,
      fill.price,
      position.quantity,
    );

    const closed: EngineClosedPosition = {
      userId: payload.userId,
      market: payload.market,
      side: position.side,
      quantity: position.quantity,
      averagePrice: position.averagePrice,
      exitPrice: fill.price,
      liquidationPrice: position.liquidationPrice,
      margin: position.margin,
      realizedPnl: pnl,
    };

    this.settle(user, position.margin + fillMargin, pnl);

    user.positions.delete(payload.market);

    return closed;
  }

  private flipPosition(
    user: EngineUser,
    position: EnginePosition,
    payload: EnginePayload,
    fill: EngineFill,
    fillMargin: bigint,
  ): EngineClosedPosition {
    const closedQuantity = position.quantity;
    const flippedQuantity = fill.quantity - closedQuantity;
    const releasedMargin = position.margin;
    const pnl = this.calculateRealizedPnl(position, fill.price, closedQuantity);
    const flippedMargin =
      (fill.price * flippedQuantity) / (SCALE * BigInt(payload.leverage));

    const closed: EngineClosedPosition = {
      userId: payload.userId,
      market: payload.market,
      side: position.side,
      quantity: closedQuantity,
      averagePrice: position.averagePrice,
      exitPrice: fill.price,
      liquidationPrice: position.liquidationPrice,
      margin: releasedMargin,
      realizedPnl: pnl,
    };

    this.settle(user, releasedMargin + (fillMargin - flippedMargin), pnl);

    user.positions.delete(payload.market);

    const flipped: EnginePosition = {
      userId: payload.userId,
      market: payload.market,
      side: payload.side,
      quantity: flippedQuantity,
      averagePrice: fill.price,
      margin: flippedMargin,
      liquidationPrice: this.calculateLiquidationPrice(
        payload.side,
        fill.price,
        payload.leverage,
      ),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    user.positions.set(payload.market, flipped);

    return closed;
  }

  closeLiquidatedPosition(
    user: EngineUser,
    position: EnginePosition,
    exitPrice: bigint,
  ): EngineClosedPosition {
    const pnl = this.calculateRealizedPnl(
      position,
      exitPrice,
      position.quantity,
    );

    const closed: EngineClosedPosition = {
      userId: position.userId,
      market: position.market,
      side: position.side,
      quantity: position.quantity,
      averagePrice: position.averagePrice,
      exitPrice,
      liquidationPrice: position.liquidationPrice,
      margin: position.margin,
      realizedPnl: pnl,
    };

    this.settle(user, position.margin, pnl);

    user.positions.delete(position.market);

    return closed;
  }

  private settle(user: EngineUser, margin: bigint, pnl: bigint) {
    user.collateral.lockedBalance -= margin;
    user.collateral.availableBalance += margin + pnl;
  }

  calculateRealizedPnl(
    position: EnginePosition,
    closePrice: bigint,
    closeQuantity: bigint,
  ) {
    const difference =
      position.side === "LONG"
        ? closePrice - position.averagePrice
        : position.averagePrice - closePrice;

    return (difference * closeQuantity) / SCALE;
  }

  calculateUnrealizedPnl(position: EnginePosition, markPrice: bigint) {
    return this.calculateRealizedPnl(position, markPrice, position.quantity);
  }

  calculateBankruptcyPrice(position: EnginePosition) {
    const move =
      position.quantity === 0n
        ? 0n
        : (position.margin * SCALE) / position.quantity;

    return position.side === "LONG"
      ? position.averagePrice - move
      : position.averagePrice + move;
  }

  calculateLiquidationPrice(
    side: OrderSide,
    averagePrice: bigint,
    leverage: number,
  ) {
    const inverseLeverage = SCALE / BigInt(leverage);
    const mmr = toBigInt(String(maintenanceMarginRate));
    const factor =
      side === "LONG"
        ? SCALE - inverseLeverage + mmr
        : SCALE + inverseLeverage - mmr;
    return (averagePrice * factor) / SCALE;
  }

  updateLiquidationPrice(position: EnginePosition) {
    position.liquidationPrice = this.calculateLiquidationPrice(
      position.side,
      position.averagePrice,
      this.effectiveLeverage(position),
    );
    position.updatedAt = Date.now();
  }

  private effectiveLeverage(position: EnginePosition) {
    if (position.margin <= 0n || position.quantity <= 0n) return 1;

    const notional = (position.averagePrice * position.quantity) / SCALE;
    const leverage = Number(
      (notional + position.margin - 1n) / position.margin,
    );

    return leverage > 0 ? leverage : 1;
  }
}
