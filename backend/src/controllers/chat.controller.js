import { generateStreamToken } from "../lib/stream.js";

// Test endpoint to check server and environment
export async function testEndpoint(req, res) {
  try {
    // console.log("Test endpoint called");
    // console.log("Environment variables check:");
    // console.log("STREAM_API_KEY exists:", !!process.env.STREAM_API_KEY);
    // console.log("STREAM_API_SECRET exists:", !!process.env.STREAM_API_SECRET);
    // console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    
    res.status(200).json({ 
      message: "Server is working",
      envCheck: {
        streamApiKey: !!process.env.STREAM_API_KEY,
        streamApiSecret: !!process.env.STREAM_API_SECRET,
        jwtSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    // console.log("Error in test endpoint:", error.message);
    res.status(500).json({ message: "Test endpoint error", error: error.message });
  }
}

export async function getStreamToken(req, res) {
  try {
    // console.log("getStreamToken called with user:", req.user);
    
    if (!req.user) {
      // console.log("No user found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    if (!req.user._id) {
      // console.log("No user._id found:", req.user);
      return res.status(400).json({ message: "Invalid user object" });
    }
    
    // console.log("Generating token for user ID:", req.user._id);
    // Convert ObjectId to string
    const userIdString = req.user._id.toString();
    // console.log("User ID as string:", userIdString);
    
    const token = generateStreamToken(userIdString);
    // console.log("Token generated successfully");

    res.status(200).json({ token });
  } catch (error) {
    // console.log("Error in getStreamToken controller:", error.message);
    // console.log("Error stack:", error.stack);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
