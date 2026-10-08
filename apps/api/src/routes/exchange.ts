import { Router } from "express";
import {
  createOrder,
  getBalance,
  onRamp,
  withdraw,
} from "../controllers/exchange";
import { asyncHandler } from "../utils/async-handler";
import { createMarket } from "../controllers/market";
import { authMiddleware } from "../middlewares/auth";

const exchangeRouter = Router();

exchangeRouter.post(
  "/create-market",
  authMiddleware,
  asyncHandler(createMarket),
);

exchangeRouter.post("/onramp", authMiddleware, asyncHandler(onRamp));
exchangeRouter.post("/withdraw", authMiddleware, asyncHandler(withdraw));
exchangeRouter.get("/balance", authMiddleware, asyncHandler(getBalance));
exchangeRouter.post("/order", authMiddleware, asyncHandler(createOrder));

export default exchangeRouter;
