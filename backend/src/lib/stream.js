import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

// console.log("Stream API Key exists:", !!apiKey);
// console.log("Stream API Secret exists:", !!apiSecret);

if (!apiKey || !apiSecret) {
  console.error("Stream API key or Secret is missing");
  throw new Error("Stream API key or Secret is missing");
}

let streamClient;
try {
  streamClient = StreamChat.getInstance(apiKey, apiSecret);
  // console.log("Stream client created successfully");
} catch (error) {
  console.error("Error creating Stream client:", error);
  throw error;
}

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const generateStreamToken = (userIdStr) => {
  try {
    // console.log("generateStreamToken called with userIdStr:", userIdStr);
    // console.log("streamClient:", streamClient);
    // console.log("streamClient.createToken:", typeof streamClient.createToken);
    
    if (!userIdStr) {
      throw new Error("userIdStr is required");
    }
    
    if (!streamClient) {
      throw new Error("Stream client not initialized");
    }
    
    const token = streamClient.createToken(userIdStr);
    // console.log("Token created successfully");
    return token;
  } catch (error) {
    console.error("Error in generateStreamToken:", error);
    throw error;
  }
};
