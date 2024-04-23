import User from "../models/user.model.js";
import { errorHandler } from "./errorHandler.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return next(errorHandler(400, "Unauthorized: No Token"));
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return next(errorHandler(401, "Invalid token "));
    }
    const user = await User.findById(decode.userId).select("-password");
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    req.user = user;
    next();
  } catch (error) {
    console.log("error in protectRoute", error);
    next(error);
  }
};
