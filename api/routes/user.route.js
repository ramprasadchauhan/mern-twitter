import express from "express";
import { protectRoute } from "../utils/protectRoute.js";
import {
  followUnfollowUser,
  getAllUsers,
  getSuggestedUsers,
  getUserProfile,
  updateUser,
} from "../controllers/user.controller.js";

const router = express.Router();
router.get("/get-all-user", getAllUsers);
router.get("/profile/:username", protectRoute, getUserProfile);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/update", protectRoute, updateUser);

export default router;
