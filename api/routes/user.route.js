import express from "express";
import { protectRoute } from "../utils/protectRoute.js";
import {
  followUnfollowUser,
  getSuggestedUsers,
  getUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.get("/suggested", protectRoute, getSuggestedUsers);

export default router;
