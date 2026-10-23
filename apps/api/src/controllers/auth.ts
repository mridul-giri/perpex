import { prisma } from "@perpex/db";
import { ApiError } from "../utils/api-error";
import bcrypt from "bcrypt";
import { signToken } from "../utils/token";
import type { Request, Response } from "express";
import { signupSchema, signinSchema } from "@perpex/schemas";
import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";

export const signup = async (req: Request, res: Response) => {
  const signupInput = signupSchema.parse(req.body);

  const existingUser = await prisma.user.findFirst({
    where: { email: signupInput.email },
  });
  if (existingUser) throw new ApiError(409, "User already exist");

  const hashedPassword = await bcrypt.hash(signupInput.password, 4);

  const user = await prisma.user.create({
    data: {
      name: signupInput.name,
      email: signupInput.email,
      password: hashedPassword,
    },
  });

  await publishToStream(config.ORDERS_CREATE, {
    userId: user.id,
    messageType: "store-user",
  });

  res.status(201).json({ userId: user.id });
};

export const signin = async (req: Request, res: Response) => {
  const signinInput = signinSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: { email: signinInput.email },
  });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(
    signinInput.password,
    user.password,
  );
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  res.status(200).json({ userId: user.id, token: signToken(user) });
};

export const logout = async (req: Request, res: Response) => {
  res.status(200).json({ success: true });
};
