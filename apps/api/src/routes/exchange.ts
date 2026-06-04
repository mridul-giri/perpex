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
// TODO: add authMiddleware here
exchangeRouter.post("/order", asyncHandler(createOrder));

export default exchangeRouter;
