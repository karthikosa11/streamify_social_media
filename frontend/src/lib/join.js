import { Call, StreamVideoClient } from "@stream-io/video-react-sdk";
import { axiosInstance } from "./axios";

// Interface for call credentials (JavaScript equivalent)
/**
 * @typedef {Object} CallCredentials
 * @property {string} apiKey - Stream API key
 * @property {string} token - User token for authentication
 * @property {string} callType - Type of call (default: 'default')
 * @property {string} callId - Unique call identifier
 * @property {string} userId - User identifier
 */

const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001"; // Our backend runs on port 5001

/**
 * Fetches call credentials from our backend server
 * @returns {Promise<CallCredentials>} The call credentials
 */
export async function fetchCallCredentials() {
  const res = await axiosInstance.get("/voice-agent/credentials");

  if (!res.data.success) {
    throw new Error(res.data.message || "Could not fetch call credentials");
  }

  const data = res.data;
  
  // Transform our backend response to match the expected format
  return {
    apiKey: data.apiKey,
    token: data.token,
    callType: 'default', // We use 'default' as our call type
    callId: data.callId,
    userId: data.userId,
    iceServers: data.iceServers
  };
}

/**
 * Connects to Stream Video and joins the call with AI agent
 * @param {CallCredentials} credentials - The call credentials
 * @returns {Promise<[StreamVideoClient, Call]>} The client and call instance
 */
export async function joinCall(credentials) {
  // console.log('🔧 Configuring StreamVideoClient with ICE servers:', credentials.iceServers);
  
  // Define more reliable ICE servers
  const reliableIceServers = [
    // Google STUN servers (most reliable)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // Single reliable TURN server
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ];
  
  const client = new StreamVideoClient({
    apiKey: credentials.apiKey,
    user: { id: credentials.userId },
    token: credentials.token,
    options: {
      // Use the reliable ICE servers
      iceServers: credentials.iceServers || reliableIceServers,
      // Additional WebRTC configuration
      rtcConfiguration: {
        iceServers: credentials.iceServers || reliableIceServers,
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        // Add more WebRTC options for better connectivity
        iceTransportPolicy: 'all',
        iceConnectionState: 'checking'
      },
      // Try to override peer connection factory
      peerConnectionFactory: {
        iceServers: credentials.iceServers || reliableIceServers
      }
    }
  });
  
  // console.log('✅ StreamVideoClient created with reliable ICE servers');
  
  const call = client.call(credentials.callType, credentials.callId);
  await call.camera.disable();
  
  // Try to configure ICE servers at the call level
  if (call.setIceServers) {
    try {
      await call.setIceServers(credentials.iceServers || reliableIceServers);
      // console.log('✅ ICE servers configured at call level');
    } catch (error) {
      // console.warn('⚠️ Could not configure ICE servers at call level:', error);
    }
  }
  
  try {
    await Promise.all([connectAgent(call, credentials.userId), call.join({ create: true })]);
  } catch (err) {
    await call.leave();
    await client.disconnectUser();
    throw err;
  }

  return [client, call];
}

/**
 * Connects the AI agent to the call using our backend endpoint
 * @param {Call} call - The Stream Video call instance
 * @param {string} userId - The user ID
 */
async function connectAgent(call, userId) {
  try {
    const res = await axiosInstance.post(`/voice-agent/join-call`, {
      callId: call.id,
      userId: userId
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Could not connect agent");
    }
  } catch (error) {
    // console.error('Error connecting agent:', error);
    throw new Error("Could not connect agent");
  }
} 