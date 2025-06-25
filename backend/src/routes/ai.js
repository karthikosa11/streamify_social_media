import express from 'express';
import { generatePost, chatWithAssistant, deleteGeneratedMedia } from '../controllers/ai.controller.js';

const router = express.Router();

// AI generation routes
router.post('/generate-post', generatePost);
router.post('/chat', chatWithAssistant);
router.delete('/delete-media', deleteGeneratedMedia);

export default router; 