import { User } from "../models/User";
import { NextFunction, Request, Response } from "express";
import { RequestExtended } from "../types/types";
export const isAuthenticated = async (
  req: RequestExtended,
  res: Response,
  next: NextFunction
) => {
  if (req.headers.authorization) {
    const tokenFromHeaders = req.headers.authorization.replace("Bearer ", "");

    const user = await User.findOne({ token: tokenFromHeaders }).select(
      "username _id email"
    );
    if (!user) {
      return res.status(401).json({ message: "Unauthorized!" });
    } else {
      req.user = user;

      return next();
    }
  } else {
    return res.status(401).json({ message: "Unauthorized!" });
  }
};
