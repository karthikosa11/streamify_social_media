import express from "express";
import { 
  initializeVoiceAgent, 
  getCallToken, 
  endCall, 
  updateAgentInstructions,
  getVoiceAgentCredentials,
  joinCallWithOpenAI,
  getRealtimeConnection,
  testGreeting
} from "../controllers/voice-agent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ success: true, message: "Voice agent API is working" });
});

// Get voice agent credentials (includes token and call info)
router.get("/credentials", protectRoute, getVoiceAgentCredentials);

// Join an existing call with OpenAI integration
router.post("/join-call", protectRoute, joinCallWithOpenAI);

// Get realtime connection for OpenAI session
router.get("/realtime-connection/:sessionId", protectRoute, getRealtimeConnection);

// Test greeting endpoint
router.post("/test-greeting", protectRoute, testGreeting);

// Initialize the voice agent (requires API keys)
router.post("/initialize", protectRoute, initializeVoiceAgent);

// Get call token for joining the call (expects { userId, callId })
router.post("/token", protectRoute, getCallToken);

// End the current call (expects { callId })
router.post("/end", protectRoute, endCall);

// Update agent instructions (expects { instructions, callId })
router.put("/instructions", protectRoute, updateAgentInstructions);

export default router; 