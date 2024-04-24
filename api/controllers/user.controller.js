import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { uploadImageToCloudinary } from "../utils/uploadImageToCloudinary.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.log("error in getAllUser controller", error);
    next(error);
  }
};

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
      // send notifications
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });
      await newNotification.save();
      // return the id of the user as a response
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

export const getSuggestedUsers = async (req, res, next) => {
  try {
    // exclude to self and followed user
    const userId = req.user._id;
    const userFollowedByMe = await User.findById(userId).select("following");
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);
    const filtedUsers = users.filter(
      (user) => !userFollowedByMe.following.includes(user._id)
    );
    const suggestedUser = filtedUsers.slice(0, 4);
    suggestedUser.forEach((user) => (user.password = null));
    res.status(200).json({
      success: true,
      data: suggestedUser,
    });
  } catch (error) {
    console.log("error in getSuggestedUser", error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    let {
      username,
      fullName,
      email,
      bio,
      link,
      currentPassword,
      newPassword,
      profileImg,
      coverImg,
    } = req.body;
    const userId = req.user._id;
    let user = await User.findById(userId);
    if (
      (!currentPassword && newPassword) ||
      (!newPassword && currentPassword)
    ) {
      return next(
        errorHandler(404, "Please provide both current and new Password")
      );
    }
    if (currentPassword && newPassword) {
      const isMatched = await bcrypt.compare(currentPassword, user.password);
      if (!isMatched) {
        return next(errorHandler(400, "current password is incorrect"));
      }
      if (newPassword.length < 6) {
        return next(errorHandler(400, "password length must be 6 charecter"));
      }
      user.password = await bcrypt.hashSync(newPassword, 10);
    }
    if (profileImg) {
      if (user.profileImg) {
        // Extract public ID from the URL and use it to delete the image
        const publicId = user.profileImg.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId, {
          folder: process.env.FOLDER,
          invalidate: true,
        });
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg, {
        folder: process.env.FOLDER,
      });
      profileImg = uploadedResponse.secure_url;
    }
    if (coverImg) {
      if (user.coverImg) {
        // Extract public ID from the URL and use it to delete the image
        const publicId = user.coverImg.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId, {
          folder: process.env.FOLDER,
          invalidate: true,
        });
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg, {
        folder: process.env.FOLDER,
      });
      coverImg = uploadedResponse.secure_url;
    }
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;
    await user.save();
    user.password = undefined;
    return res.status(200).json({
      success: true,
      message: "User Updated successfully",
      data: user,
    });
  } catch (error) {
    console.log("error in updateUser controller", error);
    next(error);
  }
};
