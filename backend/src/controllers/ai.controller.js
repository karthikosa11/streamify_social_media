import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import { writeFile, mkdir } from "fs/promises";
import { unlink } from "fs/promises";
import { access } from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cloudinary from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables");
  throw new Error("GEMINI_API_KEY is required");
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const uploadsDir = path.join(__dirname, "../../uploads");

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

try {
  await mkdir(uploadsDir, { recursive: true });
  // console.log("🟢 Uploads directory verified at:", uploadsDir);
} catch (err) {
  console.error("❌ Error creating uploads directory:", err);
}

const validateAndEnhancePrompt = (prompt) => {
  let enhancedPrompt = prompt.replace(/[^\w\s.,!?-]/g, '');
  if (!enhancedPrompt.includes('a') && !enhancedPrompt.includes('an') && !enhancedPrompt.includes('the')) {
    enhancedPrompt = `a ${enhancedPrompt}`;
  }
  if (!enhancedPrompt.toLowerCase().includes('style')) {
    enhancedPrompt += ', digital art style';
  }
  return enhancedPrompt;
};

export const generatePost = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    // console.log("🟡 Generating image. Prompt:", prompt);

    // IMAGE GENERATION FLOW
    const enhancedPrompt = validateAndEnhancePrompt(prompt);
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: enhancedPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    let imageData = null;
    let textResponse = null;

    for (const part of parts) {
      if (part.text) textResponse = part.text;
      if (part.inlineData) imageData = part.inlineData.data;
    }

    if (!imageData) {
      return res.status(500).json({ message: "No image data in response" });
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(imageData, "base64");
    const uploadResult = await cloudinary.v2.uploader.upload_stream(
      { resource_type: 'image', folder: 'streamify-ai' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Failed to upload image to Cloudinary', error: error.message });
        }
        return res.json({
          mediaUrl: result.secure_url,
          type: "image"
        });
      }
    );
    // Write buffer to stream
    const stream = uploadResult;
    stream.end(buffer);

  } catch (err) {
    console.error("❌ Error:", err.message);
    return res.status(500).json({
      message: "Failed to generate image",
      error: err.message,
      details: err.stack
    });
  }
};

export const chatWithAssistant = async (req, res) => {
  const { message, context = [] } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    // console.log("🟡 Processing chat message:", message);
    
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the chat history
    const chatHistory = context.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Add the current message
    chatHistory.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Generate response
    const result = await model.generateContent({
      contents: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });

    const response = result.response;
    if (!response || !response.text) {
      throw new Error("No response from AI assistant");
    }

    return res.json({
      message: response.text,
      type: "assistant"
    });

  } catch (error) {
    console.error("❌ Error in AI assistant:", error);
    return res.status(500).json({
      message: "Failed to get response from AI assistant",
      error: error.message
    });
  }
};

// Delete generated media (image or video)
export const deleteGeneratedMedia = async (req, res) => {
  const { mediaUrl } = req.body;

  if (!mediaUrl) {
    return res.status(400).json({ message: "Media URL is required" });
  }

  try {
    // Extract filename from mediaUrl (e.g., "/uploads/image_123.png" -> "image_123.png")
    const filename = mediaUrl.split('/').pop();
    
    if (!filename) {
      return res.status(400).json({ message: "Invalid media URL" });
    }

    // Construct the full file path
    const filepath = path.join(uploadsDir, filename);

    // Check if file exists
    try {
      await access(filepath);
    } catch (error) {
      return res.status(404).json({ message: "File not found" });
    }

    // Delete the file
    await unlink(filepath);
    
    console.log(`✅ Deleted generated media: ${filename}`);

    return res.json({
      message: "Generated media deleted successfully",
      deletedFile: filename
    });

  } catch (error) {
    console.error("❌ Error deleting generated media:", error);
    return res.status(500).json({
      message: "Failed to delete generated media",
      error: error.message
    });
  }
};
