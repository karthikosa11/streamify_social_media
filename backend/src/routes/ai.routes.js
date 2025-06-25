import express from 'express';
import { generateImage, generateVideo, chatWithAssistant } from '../controllers/ai.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// AI Image Generation
router.post('/generate-image', verifyToken, generateImage);

// AI Video Generation
router.post('/generate-video', verifyToken, generateVideo);

// AI Assistant Chat
router.post('/chat', verifyToken, chatWithAssistant);

export default router; 