import User from "../models/user.model.js";
import { errorHandler } from "../utils/errorHandler.js";

export const getUserProfile = async (req, res, next) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    res.status(200).json({
      success: true,
      message: "User profile fetch sussfully",
      data: user,
    });
  } catch (error) {
    console.log("error in getUserController", error);
    next(error);
  }
};

export const followUnfollowUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);
    if (id === req.user._id.toString()) {
      return next(errorHandler(400, "User can not follow/unfollow yourself"));
    }
    if (!userToModify || !currentUser) {
      return next(errorHandler(404, "User not found"));
    }
    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      // If already following, unfollow
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({
        success: true,
        message: "User unfollowed successfully",
      });
    } else {
      // If not following, follow

      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      res.status(200).json({
        success: true,
        message: "User followed successfully",
      });
    }
  } catch (error) {
    console.log("error in followUnfollowUser", error);
    next(error);
  }
};
