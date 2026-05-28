import { Router } from "express";
import authRouter from "./auth";
import exchangeRouter from "./exchange";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/exchange", exchangeRouter);

export default apiRouter;
