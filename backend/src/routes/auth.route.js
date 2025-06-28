import express from "express";
import { forgotPassword, login, logout, onboard, resetPassword, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Test endpoint for debugging environment variables
router.get("/test-env", (req, res) => {
  res.json({
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_PASS,
    nodeEnv: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    port: process.env.PORT,
    message: "Environment check completed"
  });
});

// Get current user info (protected route)
router.get("/me", protectRoute, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/onboarding", protectRoute, onboard);

router.post("/forgot-password",forgotPassword);
router.post("/reset-password/:token",resetPassword);

export default router;
