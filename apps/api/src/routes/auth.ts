import { Router } from "express";
import { logout, signin, signup } from "../controllers/auth";
import { asyncHandler } from "../utils/async-handler";

const authRouter = Router();

authRouter.post("/signup", asyncHandler(signup));
authRouter.post("/signin", asyncHandler(signin));
authRouter.post("/logout", asyncHandler(logout));

export default authRouter;
