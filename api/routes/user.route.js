import express from "express";
import { protectRoute } from "../utils/protectRoute.js";
import {
  followUnfollowUser,
  getUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.post("/follow/:id", protectRoute, followUnfollowUser);

export default router;
