import { StreamClient } from '@stream-io/node-sdk';
import crypto from 'crypto';
import OpenAI from 'openai';

let streamClient;
const calls = {}; // { [callId]: { call, realtimeClient } }

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const initializeVoiceAgent = async (req, res) => {
  try {
    // Get API keys from environment variables
    const streamApiKey = process.env.STREAM_API_KEY;
    const streamApiSecret = process.env.STREAM_API_SECRET;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!streamApiKey || !streamApiSecret || !openAiApiKey) {
      return res.status(400).json({ 
        message: "Missing required API keys. Please check your environment variables." 
      });
    }

    if (!streamClient) {
      streamClient = new StreamClient(streamApiKey, streamApiSecret);
    }

    // Create a call
    const callId = crypto.randomUUID();
    const call = streamClient.video.call("default", callId);
    
    // Create OpenAI Realtime session
    const session = await openai.beta.realtime.sessions.create({
      instructions: "You are Lucy, a helpful AI assistant for Streamify. You can answer questions, help with tasks, and engage in natural conversation. Be friendly, informative, and responsive to user queries.",
      turn_detection: { 
        type: "semantic_vad",
        vad: {
          silence_threshold_ms: 1000,
          speech_threshold_ms: 300
        }
      },
      input_audio_transcription: { 
        model: "gpt-4o-transcribe",
        language: "en"
      },
      input_audio_noise_reduction: { 
        type: "near_field" 
      },
      output_audio: {
        model: "tts-1",
        voice: "nova"
      }
    });

    // console.log('[OpenAI] Created Realtime session:', session.id);

    calls[callId] = { call, session };

    res.json({ 
      success: true, 
      callId,
      sessionId: session.id,
      message: "Voice agent initialized successfully" 
    });

  } catch (error) {
    console.error("Error initializing voice agent:", error);
    res.status(500).json({ 
      message: "Failed to initialize voice agent",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getCallToken = async (req, res) => {
  try {
    const { userId, callId } = req.body;
    if (!streamClient || !calls[callId]) {
      return res.status(400).json({ 
        message: "Voice agent not initialized for this callId" 
      });
    }
    // Create token with 24 hour expiration (86400 seconds)
    const token = streamClient.generateUserToken({ user_id: userId });
    res.json({ 
      success: true, 
      token,
      callId,
      apiKey: process.env.STREAM_API_KEY
    });
  } catch (error) {
    console.error("Error generating call token:", error);
    res.status(500).json({ 
      message: "Failed to generate call token",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const endCall = async (req, res) => {
  try {
    const { callId } = req.body;
    if (calls[callId]) {
      await calls[callId].call.endCall();
      delete calls[callId];
    }
    res.json({ 
      success: true, 
      message: "Call ended successfully" 
    });
  } catch (error) {
    console.error("Error ending call:", error);
    res.status(500).json({ 
      message: "Failed to end call",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateAgentInstructions = async (req, res) => {
  try {
    const { instructions, callId } = req.body;
    if (!calls[callId]) {
      return res.status(400).json({ 
        message: "Voice agent not active for this callId" 
      });
    }
    await calls[callId].realtimeClient.updateSession({
      instructions,
      turn_detection: { type: "semantic_vad" },
      input_audio_transcription: { model: "gpt-4o-transcribe" },
      input_audio_noise_reduction: { type: "near_field" },
    });
    res.json({ 
      success: true, 
      message: "Agent instructions updated successfully" 
    });
  } catch (error) {
    console.error("Error updating agent instructions:", error);
    res.status(500).json({ 
      message: "Failed to update agent instructions",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getVoiceAgentCredentials = async (req, res) => {
  try {
    // Use the authenticated user's ID from the request
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    // Check for required API keys
    const streamApiKey = process.env.STREAM_API_KEY;
    const streamApiSecret = process.env.STREAM_API_SECRET;

    if (!streamApiKey || !streamApiSecret) {
      console.error('Missing API keys:', {
        hasStreamApiKey: !!streamApiKey,
        hasStreamApiSecret: !!streamApiSecret
      });
      return res.status(500).json({ 
        success: false,
        message: "Missing required API keys. Please check server configuration." 
      });
    }

    // Initialize Stream client if not already initialized
    try {
      if (!streamClient) {
        streamClient = new StreamClient(streamApiKey, streamApiSecret);
      }
    } catch (error) {
      console.error('Error initializing Stream client:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to initialize Stream client"
      });
    }

    // Generate unique callId
    const callId = crypto.randomUUID();

    // Create a token with video permissions
    let token;
    try {
      // Create token with 24 hour expiration (86400 seconds)
      token = streamClient.generateUserToken({ user_id: userId });
    } catch (error) {
      console.error('Error creating token:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to create token"
      });
    }

    const responseData = { 
      apiKey: streamApiKey, 
      token, 
      callId, 
      userId,
      // Add comprehensive ICE servers configuration with multiple fallbacks
      iceServers: [
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
      ],
      success: true,
      message: "Voice agent credentials generated successfully"
    };

    // console.log("Sending voice agent credentials:", {
    //   ...responseData,
    //   token: '***hidden***' // Don't log the actual token
    // });

    res.json(responseData);
  } catch (error) {
    console.error("Error generating voice agent credentials:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate credentials",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const joinCallWithOpenAI = async (req, res) => {
  try {
    const { callId, userId } = req.body;
    
    if (!callId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing callId or userId"
      });
    }

    // Check for required API keys
    const streamApiKey = process.env.STREAM_API_KEY;
    const streamApiSecret = process.env.STREAM_API_SECRET;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!streamApiKey || !streamApiSecret || !openAiApiKey) {
      console.error('Missing API keys for OpenAI integration:', {
        hasStreamApiKey: !!streamApiKey,
        hasStreamApiSecret: !!streamApiSecret,
        hasOpenAiApiKey: !!openAiApiKey
      });
      return res.status(500).json({
        success: false,
        message: "Missing required API keys for OpenAI integration"
      });
    }

    // console.log('API keys validation passed:', {
    //   streamApiKey: streamApiKey ? 'Present' : 'Missing',
    //   streamApiSecret: streamApiSecret ? 'Present' : 'Missing',
    //   openAiApiKey: openAiApiKey ? 'Present' : 'Missing'
    // });

    // Initialize Stream client if not already initialized
    if (!streamClient) {
      streamClient = new StreamClient(streamApiKey, streamApiSecret);
    }

    // console.log(`Joining call ${callId} with OpenAI integration...`);

    // Join the existing call
    const call = streamClient.video.call("default", callId);
    
    // Try to use OpenAI Realtime API first
    try {
      // console.log("[OpenAI] Attempting to create Realtime session...");
      
      // Check if the Realtime API is available
      if (!openai.beta || !openai.beta.realtime) {
        throw new Error("OpenAI Realtime API not available in this SDK version");
      }
      
      const session = await openai.beta.realtime.sessions.create({
        instructions: "You are Lucy, a helpful AI assistant for Streamify. You can answer questions, help with tasks, and engage in natural conversation. Be friendly, informative, and responsive to user queries.",
        turn_detection: { 
          type: "semantic_vad",
          vad: {
            silence_threshold_ms: 1000,
            speech_threshold_ms: 300
          }
        },
        input_audio_transcription: { 
          model: "gpt-4o-transcribe",
          language: "en"
        },
        input_audio_noise_reduction: { 
          type: "near_field" 
        },
        output_audio: {
          model: "tts-1",
          voice: "nova"
        }
      });
      
      // console.log("[OpenAI] Realtime session created successfully:", session.id);
      
      // Store the call reference
      calls[callId] = { call, session };
      // console.log(`Call ${callId} joined with OpenAI Realtime API`);
      // console.log(`[Debug] Stored call data for ${callId}:`, {
      //   hasCall: !!calls[callId].call,
      //   hasSession: !!calls[callId].session,
      //   callId: callId
      // });
      // console.log(`[Debug] Total calls in memory:`, Object.keys(calls));

      res.json({
        success: true,
        sessionId: session.id,
        message: "Successfully joined call with OpenAI Realtime API"
      });
      
    } catch (realtimeError) {
      console.error('[OpenAI] Realtime API failed, falling back to Stream integration:', realtimeError);
      
      // Fallback to Stream's OpenAI integration
      try {
        const realtimeClient = await streamClient.video.connectOpenAi({
          call,
          openAiApiKey: process.env.OPENAI_API_KEY,
          agentUserId: "lucy",
        });

        // Set up comprehensive event handling for both OpenAI and Stream Video events
        realtimeClient.on('realtime.event', ({ time, source, event }) => {
          // console.log(`OpenAI Event: ${event.type}`, event);
          
          if (event.type === 'response.audio_transcript.done') {
            // console.log(`🎤 Transcript received: ${event.transcript}`);
          }
          
          if (event.type === 'response.audio_transcript.partial') {
            // console.log(`🎤 Partial transcript: ${event.transcript}`);
          }
          
          if (event.type === 'response.audio_transcript.error') {
            console.error(`❌ Transcript error:`, event);
          }
          
          if (event.type === 'response.audio_transcript.start') {
            // console.log(`🎤 Starting transcription...`);
          }
          
          if (event.type === 'response.audio_transcript.stop') {
            // console.log(`🎤 Stopped transcription`);
          }
          
          if (event.type === 'response.audio_transcript.volume') {
            // console.log(`🔊 Volume level: ${event.volume}`);
          }
          
          if (event.type === 'response.audio_transcript.speaking') {
            // console.log(`🗣️ Speaking detected: ${event.speaking}`);
          }
          
          if (event.type === 'response.audio_transcript.silence') {
            // console.log(`🔇 Silence detected: ${event.silence}`);
          }
          
          if (event.type === 'response.audio_transcript.turn_detection') {
            // console.log(`🔄 Turn detection: ${event.turn_detection}`);
          }
          
          if (event.type === 'response.audio_transcript.turn_detection.start') {
            // console.log(`🔄 Turn detection started`);
          }
          
          if (event.type === 'response.audio_transcript.turn_detection.stop') {
            // console.log(`🔄 Turn detection stopped`);
          }
          
          if (event.type === 'response.audio_transcript.turn_detection.error') {
            console.error(`❌ Turn detection error:`, event);
          }
          
          // Add logging for audio response events
          if (event.type === 'response.audio_response.done') {
            // console.log("🎤 Lucy should now be speaking:", event.response?.text);
            // console.log("🎤 Audio response details:", {
            //   text: event.response?.text,
            //   audioUrl: event.response?.audio_url,
            //   duration: event.response?.duration,
            //   timestamp: new Date().toISOString()
            // });
          }
          
          if (event.type === 'response.audio_response.start') {
            // console.log("🎤 Lucy starting to speak...");
          }
          
          if (event.type === 'response.audio_response.error') {
            console.error("❌ Audio response error:", event);
          }
          
          if (event.type === 'response.audio_response.partial') {
            // console.log("🎤 Lucy speaking (partial):", event.response?.text);
          }
        });
        
        realtimeClient.on("call.session_participant_joined", (event) => {
          // console.log(`[Stream] Participant joined: ${event.participant.user_id}`);
          if (event.participant.user_id === 'lucy') {
            // console.log('[Stream] 🎉 Lucy joined the call as a participant!');
            
            // Trigger greeting when Lucy joins
            setTimeout(async () => {
              try {
                // console.log("[OpenAI] Triggering greeting from Lucy after joining...");
                await realtimeClient.sendMessage({
                  type: "text",
                  text: "Hi! How are you? How can I help you today?"
                });
                // console.log("[OpenAI] Greeting sent after joining");
              } catch (greetingError) {
                console.error("[OpenAI] Error sending greeting after joining:", greetingError);
              }
            }, 1000); // Wait 1 second after joining
          }
        });
        
        realtimeClient.on("call.session_participant_left", (event) => {
          // console.log(`[Stream] Participant left: ${event.participant.user_id}`);
        });
        
        realtimeClient.on("call.ended", (event) => {
          // console.log("[Stream] Call ended, disconnecting...");
        });
        
        realtimeClient.on("error", (error) => {
          console.error("[OpenAI Agent Error]", error);
        });

        // Add session update event handler
        realtimeClient.on("session.update", (event) => {
          // console.log("[OpenAI] Session update:", event);
        });

        // Set comprehensive agent instructions and configuration
        // console.log("[OpenAI] Setting up session configuration...");
        try {
          await realtimeClient.updateSession({
            instructions: "You are Lucy, a helpful AI assistant for Streamify. You can answer questions, help with tasks, and engage in natural conversation. Be friendly, informative, and responsive to user queries. When you first join a call, always greet the user with 'Hi! How are you? How can I help you today?'",
            turn_detection: { 
              type: "semantic_vad",
              vad: {
                silence_threshold_ms: 1000,
                speech_threshold_ms: 300
              }
            },
            input_audio_transcription: { 
              model: "gpt-4o-transcribe",
              language: "en"
            },
            input_audio_noise_reduction: { 
              type: "near_field" 
            },
            output_audio: {
              model: "tts-1",
              voice: "nova"
            }
          });
          // console.log("[OpenAI] Session configuration completed successfully");
          
          // Trigger an initial greeting from Lucy
          setTimeout(async () => {
            try {
              // console.log("[OpenAI] Triggering initial greeting from Lucy...");
              await realtimeClient.sendMessage({
                type: "text",
                text: "Hi! How are you? How can I help you today?"
              });
              // console.log("[OpenAI] Initial greeting sent successfully");
            } catch (greetingError) {
              console.error("[OpenAI] Error sending initial greeting:", greetingError);
            }
          }, 2000); // Wait 2 seconds after session setup
          
        } catch (sessionError) {
          console.error("[OpenAI] Error configuring session:", sessionError);
          throw new Error(`Failed to configure OpenAI session: ${sessionError.message}`);
        }
        
        // Log that we're ready to receive audio
        // console.log('[OpenAI] Lucy is now listening for audio input...');
        // console.log('[OpenAI] Speak into your microphone to test the conversation!');

        // Store the call reference
        calls[callId] = { call, realtimeClient };
        // console.log(`Call ${callId} joined with Stream OpenAI integration (fallback)`);
        // console.log(`[Debug] Stored call data for ${callId}:`, {
        //   hasCall: !!calls[callId].call,
        //   hasRealtimeClient: !!calls[callId].realtimeClient,
        //   callId: callId
        // });
        // console.log(`[Debug] Total calls in memory:`, Object.keys(calls));

        res.json({
          success: true,
          message: "Successfully joined call with Stream OpenAI integration (fallback)",
          fallback: true
        });
        
      } catch (streamError) {
        console.error('[Stream] OpenAI integration also failed:', streamError);
        throw new Error(`Both OpenAI Realtime API and Stream integration failed: ${streamError.message}`);
      }
    }

  } catch (error) {
    console.error('Error joining call with OpenAI:', error);
    res.status(500).json({
      success: false,
      message: "Failed to join call with OpenAI integration",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Setup function for realtime client with tools (matching documentation)
async function setupRealtimeClient(realtimeClient) {
  realtimeClient.on("error", (event) => {
    console.error("Error:", event);
  });

  realtimeClient.on("session.update", (event) => {
    // console.log("Realtime session update:", event);
  });

  realtimeClient.updateSession({
    instructions: "You are a helpful assistant that can answer questions and help with tasks.",
    turn_detection: { type: "semantic_vad" },
    input_audio_transcription: { model: "gpt-4o-transcribe" },
    input_audio_noise_reduction: { type: "near_field" },
  });

  realtimeClient.addTool(
    {
      name: "get_weather",
      description:
        "Call this function to retrieve current weather information for a specific location. Provide the city name.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "The name of the city to get weather information for",
          },
        },
        required: ["city"],
      },
    },
    async ({ city, country, units = "metric" }) => {
      // console.log("get_weather request", { city, country, units });
      try {
        // This is a placeholder for actual weather API implementation
        // In a real implementation, you would call a weather API service here
        const weatherData = {
          location: country ? `${city}, ${country}` : city,
          temperature: 22,
          units: units === "imperial" ? "°F" : "°C",
          condition: "Partly Cloudy",
          humidity: 65,
          windSpeed: 10
        };
        
        return weatherData;
      } catch (error) {
        console.error("Error fetching weather data:", error);
        return { error: "Failed to retrieve weather information" };
      }
    },
  );

  return realtimeClient;
}

export const getRealtimeConnection = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Missing sessionId"
      });
    }

    // Get connection token for the session
    const connection = await openai.beta.realtime.connections.create({
      sessionId: sessionId
    });

    res.json({
      success: true,
      connectionToken: connection.connection_token
    });

  } catch (error) {
    console.error('Error getting realtime connection:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get realtime connection",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const testGreeting = async (req, res) => {
  try {
    const { callId, userId } = req.body;
    
    // console.log("[Test] Received test greeting request:", { callId, userId });
    // console.log("[Test] Available calls:", Object.keys(calls));
    
    if (!callId || !userId) {
      // console.log("[Test] Missing callId or userId");
      return res.status(400).json({
        success: false,
        message: "Missing callId or userId"
      });
    }

    const callData = calls[callId];
    // console.log("[Test] Call data found:", !!callData);
    
    if (!callData) {
      // console.log("[Test] Call not found in calls object");
      return res.status(400).json({
        success: false,
        message: "Call not found"
      });
    }

    // console.log("[Test] Call data structure:", {
    //   hasCall: !!callData.call,
    //   hasRealtimeClient: !!callData.realtimeClient,
    //   hasSession: !!callData.session
    // });

    // console.log("[Test] Sending test greeting from Lucy...");
    
    if (callData.realtimeClient) {
      // Using Stream OpenAI integration
      // console.log("[Test] Using Stream OpenAI integration");
      await callData.realtimeClient.sendMessage({
        type: "text",
        text: "Hi! This is a test greeting from Lucy. How can I help you today?"
      });
      // console.log("[Test] Test greeting sent via Stream integration");
    } else if (callData.session) {
      // Using OpenAI Realtime API
      // console.log("[Test] OpenAI Realtime API session found, but direct messaging not supported");
    } else {
      // console.log("[Test] No realtimeClient or session found");
      return res.status(400).json({
        success: false,
        message: "No active OpenAI connection found for this call"
      });
    }

    res.json({
      success: true,
      message: "Test greeting sent successfully"
    });

  } catch (error) {
    console.error('Error sending test greeting:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to send test greeting",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 