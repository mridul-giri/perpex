import { Router } from "express";
import { cancelOrder, createOrder } from "../../controllers/orders";
import { authMiddleware } from "../../middlewares/auth";
import { idempotencyMiddleware } from "../../middlewares/idempotency";
import { asyncHandler } from "../../utils/async-handler";

const ordersRouter = Router();

ordersRouter.use(authMiddleware);

ordersRouter.post("/", idempotencyMiddleware, asyncHandler(createOrder));
ordersRouter.delete(
  "/:orderId",
  idempotencyMiddleware,
  asyncHandler(cancelOrder),
);

export default ordersRouter;
