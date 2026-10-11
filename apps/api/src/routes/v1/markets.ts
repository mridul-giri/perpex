import { Router } from "express";
import {
  getCandles,
  getMarket,
  getMarketRisk,
  getMarkets,
  getOrderbook,
  getTrades,
} from "../../controllers/markets";
import { asyncHandler } from "../../utils/async-handler";

const marketsRouter = Router();

marketsRouter.get("/", asyncHandler(getMarkets));
marketsRouter.get("/:market", asyncHandler(getMarket));
marketsRouter.get("/:market/candles", asyncHandler(getCandles));
marketsRouter.get("/:market/trades", asyncHandler(getTrades));
marketsRouter.get("/:market/orderbook", asyncHandler(getOrderbook));
marketsRouter.get("/:market/risk", asyncHandler(getMarketRisk));

export default marketsRouter;
