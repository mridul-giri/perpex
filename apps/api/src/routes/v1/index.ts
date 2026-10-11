import { Router } from "express";
import authRouter from "./auth";
import marketsRouter from "./markets";
import accountRouter from "./account";
import ordersRouter from "./orders";
import adminRouter from "./admin";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/markets", marketsRouter);
v1Router.use("/account", accountRouter);
v1Router.use("/orders", ordersRouter);
v1Router.use("/admin", adminRouter);

export default v1Router;
