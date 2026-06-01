import { Router } from "express";
import { createOrder } from "../controllers/exchange";
import { asyncHandler } from "../utils/async-handler";
import { createMarket } from "../controllers/market";
import { authMiddleware } from "../middlewares/auth";

const exchangeRouter = Router();

exchangeRouter.post(
  "/create-market",
  authMiddleware,
  asyncHandler(createMarket),
);
exchangeRouter.post("/order", authMiddleware, asyncHandler(createOrder));

export default exchangeRouter;
