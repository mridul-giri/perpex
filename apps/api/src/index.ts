import express from "express";
import apiRouter from "./routes";
import { errorMiddleware } from "./middlewares/error";
import { corsMiddleware } from "./middlewares/cors";
import { connectRedis } from "@perpex/redis";
import { readAckStream } from "./services/listener";
import { ApiError } from "./utils/api-error";

const app = express();

app.use(corsMiddleware);
app.use(express.json());

await connectRedis();
void readAckStream();

app.use("/api", apiRouter);

app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use(errorMiddleware);

app.listen(3001, () => console.log("server is running on port 3001"));
