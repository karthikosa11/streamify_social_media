import express from "express";
import { createStory, deleteStory, getStories } from "../controllers/story.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protectRoute);

// Story routes
router.post("/", createStory);
router.get("/", getStories);
router.delete("/:storyId", deleteStory);

export default router; 