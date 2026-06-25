import type { Fill, PayloadType, Position, User } from "@perpex/types";
import { EngineError } from "../utils/engine-error";
import { maintenanceMarginRate } from "../store/store";
import { UserService } from "./user";

export class PositionManager {
  async getPosition(user: User, payload: PayloadType) {
    for (const position of user.positions) {
      if (position.market === payload.market) {
        return position;
      }
    }
    return null;
  }

  async createPosition(
    user: User,
    payload: PayloadType,
    fill: Fill,
    leverage: number,
    margin: number,
  ) {
    const liquidationPrice = await this.calculateLiquidationPrice(
      payload.side,
      fill.price,
      leverage,
    );

    const newPosition: Position = {
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
    position: Position,
    payload: PayloadType,
    fill: Fill,
    actualCollateralUsed: number,
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
    user: User,
    position: Position,
    fill: Fill,
    actualCollateralUsed: number,
    payload: PayloadType,
    remainingPositionQty: number,
    closeQty: number,
    releaseCollateral: (user: User, surplus: number) => void,
    addPnl: (user: User, pnl: number) => void,
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
    fill: Fill,
    position: Position,
    closeQty: number,
    actualCollateralUsed: number,
    user: User,
    releaseCollateral: (user: User, surplus: number) => void,
    addPnl: (user: User, pnl: number) => void,
    deleteOpenPosition: (
      User: User,
      userId: string,
      position: Position,
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

  async calculateAvgPrice(position: Position, fill: Fill) {
    const totalQty = position.quantity + fill.quantity;
    return (
      (position.averagePrice * position.quantity + fill.price * fill.quantity) /
      totalQty
    );
  }

  async calculatePnl(fill: Fill, closeQty: number, position: Position) {
    return fill.takerSide === "LONG"
      ? (fill.price - position.averagePrice) * closeQty
      : (position.averagePrice - fill.price) * closeQty;
  }

  async calculateLiquidationPrice(
    side: string,
    avgPrice: number,
    leverage: number,
  ) {
    return side === "LONG"
      ? avgPrice * (1 - 1 / leverage + maintenanceMarginRate)
      : avgPrice * (1 + 1 / leverage - maintenanceMarginRate);
  }
}
