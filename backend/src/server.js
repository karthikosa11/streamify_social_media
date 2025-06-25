import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import storyRoutes from "./routes/story.route.js";
import aiRoutes from "./routes/ai.js";
import postRoutes from "./routes/posts.js";
import voiceAgentRoutes from "./routes/voice-agent.route.js";
import aiAssistantRoutes from "./routes/ai-assistant.route.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 5001;

const __dirname = path.resolve();

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? [process.env.FRONTEND_URL] 
      : ["http://localhost:5173", "http://localhost:5174"],
    credentials: true, // allow frontend to send cookies
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/voice-agent", voiceAgentRoutes);
app.use("/api/ai-assistant", aiAssistantRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl
  });
});



app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoints available at ${process.env.FRONTEND_URL || 'http://localhost:5001'}/api`);
  console.log(`🤖 AI Assistant endpoint: ${process.env.FRONTEND_URL || 'http://localhost:5001'}/api/ai-assistant`);
  console.log(`🧪 Test endpoint: ${process.env.FRONTEND_URL || 'http://localhost:5001'}/api/ai-assistant/test`);
  connectDB();
});
