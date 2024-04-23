import { generateTokenAndSetCookie } from "../lib/genrateToken.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res, next) => {
  try {
    const { username, fullName, email, password } = req.body;
    if (password.length < 6) {
      return next(errorHandler(400, "Password must have atleast 6 charecter"));
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return next(errorHandler(400, "plese provide valid email"));
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return next(errorHandler(400, "Username already register"));
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return next(errorHandler(400, "Email already register"));
    }
    const hashedPassword = await bcrypt.hashSync(password, 10);
    const newUser = await User.create({
      username,
      fullName,
      email,
      password: hashedPassword,
    });
    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      let userData = await newUser.save();
      const { password, ...rest } = userData._doc;
      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: rest,
      });
    } else {
      next(errorHandler(400, "Invalid user data"));
    }
  } catch (error) {
    console.log("error in signup controlller", error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return next(errorHandler(404, "User not register, please signup"));
    }
    const comparePassword = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!comparePassword) {
      return next(errorHandler(404, "Password not matched"));
    }
    generateTokenAndSetCookie(user._id, res);
    user.password = undefined;
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: user,
    });
  } catch (error) {
    console.log("error in login controlller", error);
    next(error);
  }
};
export const logout = async (req, res, next) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("error in logout controller", error);
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.log("error in getMe controller", error);
    next(error);
  }
};
