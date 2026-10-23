import { Router } from "express";
import {
  deposit,
  getBalance,
  getFills,
  getLiquidations,
  getOrder,
  getOrders,
  getOpenPositions,
  getPosition,
  getPositionHistory,
  withdraw,
} from "../../controllers/account";
import { authMiddleware } from "../../middlewares/auth";
import { idempotencyMiddleware } from "../../middlewares/idempotency";
import { asyncHandler } from "../../utils/async-handler";

const accountRouter = Router();

accountRouter.use(authMiddleware);

accountRouter.get("/balance", asyncHandler(getBalance));
accountRouter.post("/deposits", idempotencyMiddleware, asyncHandler(deposit));
accountRouter.post(
  "/withdrawals",
  idempotencyMiddleware,
  asyncHandler(withdraw),
);
accountRouter.get("/positions", asyncHandler(getOpenPositions));
accountRouter.get("/positions/history", asyncHandler(getPositionHistory));
accountRouter.get("/positions/:market", asyncHandler(getPosition));
accountRouter.get("/fills", asyncHandler(getFills));
accountRouter.get("/orders", asyncHandler(getOrders));
accountRouter.get("/orders/:orderId", asyncHandler(getOrder));
accountRouter.get("/liquidations", asyncHandler(getLiquidations));

export default accountRouter;
