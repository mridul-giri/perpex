import express from "express";
import apiRouter from "./routes";
import { errorMiddleware } from "./middlewares/error";
import { connectRedis } from "@perpex/redis";
import { readAckStream } from "./services/listener";

const app = express();
app.use(express.json());

await connectRedis();
void readAckStream(); // fire and forget technique

app.use("/api", apiRouter);

app.use(errorMiddleware);

app.listen(3001, () => console.log("server is running on port 3001"));
