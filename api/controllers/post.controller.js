import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/errorHandler.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res, next) => {
  try {
    let { text, img } = req.body;
    const userId = req.user._id.toString();
    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    if (!text && !img) {
      return next(errorHandler(400, "Post must have test or image"));
    }
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img, {
        folder: process.env.FOLDER,
      });
      img = uploadedResponse.secure_url;
    }
    const newPost = await Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    console.log("error in createPost controller", error);
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(errorHandler(404, "Post not found"));
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return next(
        errorHandler(400, "You are not athorized to delete this post")
      );
    }
    if (post.img) {
      let imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId, {
        folder: process.env.FOLDER,
        invalidate: true,
      });
    }
    await Post.findByIdAndDelete(postId);
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log("error in deletePost controller", error);
    next(error);
  }
};

export const commentOnPost = async (req, res, next) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!text) {
      return next(errorHandler(400, "text field is required"));
    }
    if (!post) {
      return next(errorHandler(404, "Post not found"));
    }

    await post.comments.push({ text, user: req.user._id });
    await post.save();
    res.status(200).json({
      success: true,
      message: "Comment add successfully",
      data: post,
    });
  } catch (error) {
    console.log("error in commentOnPost controller", error);
    next(error);
  }
};

export const likeUnlikePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(errorHandler(404, "Post not found"));
    }
    const userLikePost = await post.likes.includes(userId);
    if (userLikePost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likePosts: postId } });
      await Notification.deleteOne({
        from: userId,
        to: post.user,
        type: "like",
      });
      res.status(200).json({
        success: true,
        message: "Post Unliked successfull",
      });
    } else {
      // like post
      await post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likePosts: postId } });
      await post.save();
      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();
      await res.status(200).json({
        success: true,
        message: "Notification send successfully",
        data: post,
      });
    }
  } catch (error) {
    console.log("error in likeUnlikePost controller", error);
    next(error);
  }
};

export const getAllPosts = async (req, res, next) => {
  try {
    const allPosts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (allPosts.length === 0) {
      return next(errorHandler(404, "No posts found"));
    }
    res.status(200).json({
      success: true,
      message: "All posts fetched successfully",
      count: allPosts.length,
      data: allPosts,
    });
  } catch (error) {
    console.log("error in getAllPosts controller", error);
    next(error);
  }
};

export const getLikePosts = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    let likedPosts = await Post.find({ _id: { $in: user.likePosts } })
      .populate({
        path: "user",
        select: "password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json({
      success: true,
      message: "like posts fetched successfully",
      data: likedPosts,
    });
  } catch (error) {
    console.log("error in getLikePosts controller", error);
    next(error);
  }
};

export const getFollowingPosts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    const following = await user.following;
    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json({
      success: true,
      message: "feedPosts fetched successfully",
      data: feedPosts,
    });
  } catch (error) {
    console.log("error in getLikePosts controller", error);
    next(error);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });
    // console.log(user);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    const userPosts = await Post.find({ user: user._id });
    if (userPosts.length === 0 || !userPosts) {
      return next(errorHandler(404, "No posts found"));
    }

    res.status(200).json({
      success: true,
      message: "User posts fetched successfully",
      count: userPosts.length,
      data: userPosts,
    });
  } catch (error) {
    console.log("error in getLikePosts controller", error);
    next(error);
  }
};
