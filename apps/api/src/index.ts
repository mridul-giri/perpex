import express from "express";
import apiRouter from "./routes";
import { errorMiddleware } from "./middlewares/error-middleware";

const app = express();
app.use(express.json());

app.use("/api", apiRouter);

app.use(errorMiddleware);

app.listen(3001, () => console.log("server is running on port 3001"));
