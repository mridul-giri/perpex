import { prisma } from "@perpex/db";
import { ApiError } from "../utils/api-error";
import { validateEmail } from "../utils/validate-email";
import bcrypt from "bcrypt";
import { addCookie } from "../utils/add-cookie";
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

  const isEmailValid = validateEmail(signupInput.email);
  if (!isEmailValid) throw new ApiError(400, "Invalid email");

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

  await addCookie(user, res);

  res.status(201).json(user.id);
};

export const signin = async (req: Request, res: Response) => {
  const signinInput = signinSchema.parse(req.body);

  const isEmailValid = validateEmail(signinInput.email);
  if (!isEmailValid) throw new ApiError(400, "Invalid email");

  const user = await prisma.user.findFirst({
    where: { email: signinInput.email },
  });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(
    signinInput.password,
    user.password,
  );
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  await addCookie(user, res);

  res.status(200).json(user.id);
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.send();
};
