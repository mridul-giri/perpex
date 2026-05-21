import { Router } from "express";
import authRouter from "./auth-route";
import exchangeRouter from "./exchange-route";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/exchange", exchangeRouter);

export default apiRouter;
