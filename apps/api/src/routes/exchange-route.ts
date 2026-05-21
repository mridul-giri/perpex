import { Router } from "express";
import { createOrder } from "../controllers/exchange-controller";
import { asyncHandler } from "../utils/async-handler";

const exchangeRouter = Router();

exchangeRouter.post("/order", asyncHandler(createOrder));

export default exchangeRouter;
