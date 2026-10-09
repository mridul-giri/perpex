import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getBalance,
  onRamp,
  withdraw,
} from "../controllers/exchange";
import { asyncHandler } from "../utils/async-handler";
import { createMarket } from "../controllers/market";
import { authMiddleware } from "../middlewares/auth";
import { idempotencyMiddleware } from "../middlewares/idempotency";

const exchangeRouter = Router();

exchangeRouter.post(
  "/create-market",
  authMiddleware,
  asyncHandler(createMarket),
);

exchangeRouter.post(
  "/onramp",
  authMiddleware,
  idempotencyMiddleware,
  asyncHandler(onRamp),
);
exchangeRouter.post(
  "/withdraw",
  authMiddleware,
  idempotencyMiddleware,
  asyncHandler(withdraw),
);
exchangeRouter.get("/balance", authMiddleware, asyncHandler(getBalance));
exchangeRouter.post(
  "/order",
  authMiddleware,
  idempotencyMiddleware,
  asyncHandler(createOrder),
);
exchangeRouter.delete(
  "/order",
  authMiddleware,
  idempotencyMiddleware,
  asyncHandler(cancelOrder),
);

export default exchangeRouter;
