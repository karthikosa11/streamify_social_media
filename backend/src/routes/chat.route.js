import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken, testEndpoint } from "../controllers/chat.controller.js";

const router = express.Router();

// Test endpoint (no auth required)
router.get("/test", testEndpoint);

router.get("/token", protectRoute, getStreamToken);

export default router;
