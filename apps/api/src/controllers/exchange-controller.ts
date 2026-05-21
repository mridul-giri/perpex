import type { Request, Response } from "express";
import { placeOrder, sortAsks } from "../services/order-book";
import {
  Side,
  Status,
  Type,
  type OrderBooks,
  type OrderInput,
  type User,
  type Users,
} from "@perpex/types";

const markPrice = 100;

export const createOrder = async (req: Request, res: Response) => {
  const { userId, symbol, type, side, quantity, leverage } = req.body;

  const limitPrice = type === "LIMIT" ? req.body.limitPrice : markPrice;

  const orderInput: OrderInput = {
    userId,
    symbol,
    type,
    side,
    quantity,
    limitPrice,
    leverage,
  };

  placeOrder(orderInput);

  res.status(200).json({ data: { limitPrice, quantity, symbol, type } });
};
