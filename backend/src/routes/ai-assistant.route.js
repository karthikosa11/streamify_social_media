import express from "express";
import { 
  startAIAgent,
  stopAIAgent,
  getAIAgentStatus
} from "../controllers/ai-assistant.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Test endpoint to verify route is working
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "AI Assistant route is working",
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint without authentication
router.post("/test-start", (req, res) => {
  // console.log('🟡 Test start endpoint called with body:', req.body);
  res.json({
    success: true,
    message: 'Test start endpoint working',
    received: req.body
  });
});

// Test endpoint to manually trigger AI response
router.post("/test-message", async (req, res) => {
  try {
    const { channelId, message } = req.body;
    // console.log('🟡 Test message received:', { channelId, message });
    
    const { handleUserMessage, activeAgents } = await import('../controllers/ai-assistant.controller.js');
    
    const agentConfig = activeAgents.get(channelId);
    if (agentConfig) {
      // console.log('🟡 Found agent config, processing test message');
      await handleUserMessage({
        message: { text: message, id: 'test-message-id' },
        user_id: 'test-user',
        type: 'message.new'
      }, agentConfig);
      
      res.json({ success: true, message: 'Test message processed' });
    } else {
      res.status(400).json({ success: false, message: 'No agent config found for channel' });
    }
  } catch (error) {
    console.error('❌ Test message error:', error);
    res.status(500).json({ success: false, message: 'Error processing test message' });
  }
});

// Simple manual trigger for AI response
router.post("/manual-trigger", async (req, res) => {
  try {
    const { channelId, message } = req.body;
    // console.log('🟡 Manual trigger received:', { channelId, message });
    
    const { handleUserMessage, activeAgents } = await import('../controllers/ai-assistant.controller.js');
    
    const agentConfig = activeAgents.get(channelId);
    if (agentConfig) {
      // console.log('🟡 Found agent config, manually triggering AI response');
      
      await handleUserMessage({
        message: { text: message, id: 'manual-trigger-id' },
        user_id: '6845f59815bb963047e3d005',
        type: 'message.new'
      }, agentConfig);
      
      res.json({ success: true, message: 'Manual trigger processed successfully' });
    } else {
      res.status(400).json({ success: false, message: 'No agent config found for channel' });
    }
  } catch (error) {
    console.error('❌ Manual trigger error:', error);
    res.status(500).json({ success: false, message: 'Error processing manual trigger' });
  }
});

// Start AI agent for a channel
router.post("/start", protectRoute, startAIAgent);

// Stop AI agent for a channel
router.post("/stop", protectRoute, stopAIAgent);

// Get AI agent status for a channel
router.get("/status/:channelId", protectRoute, getAIAgentStatus);

export default router; 