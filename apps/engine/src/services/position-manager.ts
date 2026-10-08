import type {
  EngineFill,
  EnginePayload,
  EnginePosition,
  EngineUser,
} from "@perpex/types";
import { maintenanceMarginRate } from "../store/store";
import { SCALE, toBigInt } from "../utils/conversion";

export class PositionManager {
  async getPosition(user: EngineUser, payload: EnginePayload) {
    for (const position of user.positions) {
      if (position.market === payload.market) {
        return position;
      }
    }
    return null;
  }

  async createPosition(
    user: EngineUser,
    payload: EnginePayload,
    fill: EngineFill,
    leverage: number,
    margin: bigint,
  ) {
    const liquidationPrice = await this.calculateLiquidationPrice(
      payload.side,
      fill.price,
      leverage,
    );

    const newPosition: EnginePosition = {
      userId: payload.userId,
      market: payload.market,
      positionType: payload.type,
      side: payload.side,
      quantity: fill.quantity,
      margin,
      averagePrice: fill.price,
      liquidationPrice,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    user.positions.push(newPosition);
  }

  async updatePosition(
    position: EnginePosition,
    payload: EnginePayload,
    fill: EngineFill,
    actualCollateralUsed: bigint,
  ) {
    const averagePrice = await this.calculateAvgPrice(position, fill);

    const newQuantity = position.quantity + fill.quantity;
    const newMargin = position.margin + actualCollateralUsed;

    const liquidationPrice = await this.calculateLiquidationPrice(
      payload.side,
      averagePrice,
      payload.leverage,
    );

    position.quantity = newQuantity;
    position.margin = newMargin;
    position.averagePrice = averagePrice;
    position.liquidationPrice = liquidationPrice;
  }

  async partiallyClosePosition(
    user: EngineUser,
    position: EnginePosition,
    fill: EngineFill,
    actualCollateralUsed: bigint,
    payload: EnginePayload,
    remainingPositionQty: bigint,
    closeQty: bigint,
    releaseCollateral: (user: EngineUser, surplus: bigint) => void,
    addPnl: (user: EngineUser, pnl: bigint) => void,
  ) {
    const averagePrice = await this.calculateAvgPrice(position, fill);
    const newMargin = position.margin - actualCollateralUsed;

    const liquidationPrice = await this.calculateLiquidationPrice(
      payload.side,
      averagePrice,
      payload.leverage,
    );

    const pnl = await this.calculatePnl(fill, closeQty, position);

    releaseCollateral(user, newMargin);
    addPnl(user, pnl);

    position.liquidationPrice = liquidationPrice;
    position.averagePrice = averagePrice;
    position.margin = newMargin;
    position.quantity = remainingPositionQty;
  }

  async closePosition(
    fill: EngineFill,
    position: EnginePosition,
    closeQty: bigint,
    actualCollateralUsed: bigint,
    user: EngineUser,
    releaseCollateral: (user: EngineUser, surplus: bigint) => void,
    addPnl: (user: EngineUser, pnl: bigint) => void,
    deleteOpenPosition: (
      User: EngineUser,
      userId: string,
      position: EnginePosition,
    ) => void,
    userId: string,
  ) {
    const pnl = await this.calculatePnl(fill, closeQty, position);
    console.log("pnl in close condition", pnl);

    const newMargin = position.margin - actualCollateralUsed;

    releaseCollateral(user, newMargin);
    addPnl(user, pnl);
    deleteOpenPosition(user, userId, position);

    console.log("close full condition collateral", user.collateral);
    console.log("postion-if-side-oppostie-and-close-condition", user.positions);
  }

  async calculateAvgPrice(position: EnginePosition, fill: EngineFill) {
    const totalQty = position.quantity + fill.quantity;
    return (
      (position.averagePrice * position.quantity + fill.price * fill.quantity) /
      totalQty
    );
  }

  async calculatePnl(
    fill: EngineFill,
    closeQty: bigint,
    position: EnginePosition,
  ) {
    return fill.takerSide === "LONG"
      ? (fill.price - position.averagePrice) * closeQty
      : (position.averagePrice - fill.price) * closeQty;
  }

  async calculateLiquidationPrice(
    side: string,
    avgPrice: bigint,
    leverage: number,
  ) {
    const inverseLeverage = SCALE / BigInt(leverage);
    const mmr = toBigInt(String(maintenanceMarginRate));
    const factor =
      side === "LONG"
        ? SCALE - inverseLeverage + mmr
        : SCALE + inverseLeverage - mmr;
    return (avgPrice * factor) / SCALE;
  }
}
