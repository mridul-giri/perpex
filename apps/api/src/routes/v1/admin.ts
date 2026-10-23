import { Router } from "express";
import { createMarket } from "../../controllers/admin";
import { adminMiddleware } from "../../middlewares/admin";
import { authMiddleware } from "../../middlewares/auth";
import { idempotencyMiddleware } from "../../middlewares/idempotency";
import { asyncHandler } from "../../utils/async-handler";

const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.post("/markets", idempotencyMiddleware, asyncHandler(createMarket));

export default adminRouter;
