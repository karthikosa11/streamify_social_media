import { StreamChat } from 'stream-chat';
import OpenAI from 'openai';
// import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
if (!process.env.STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
  console.error('❌ Missing Stream API credentials');
  console.error('❌ STREAM_API_KEY:', process.env.STREAM_API_KEY ? 'Present' : 'Missing');
  console.error('❌ STREAM_API_SECRET:', process.env.STREAM_API_SECRET ? 'Present' : 'Missing');
  throw new Error('STREAM_API_KEY and STREAM_API_SECRET are required');
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OpenAI API key');
  console.error('❌ OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
  throw new Error('OPENAI_API_KEY is required');
}

// console.log('✅ Environment variables validated successfully');

const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// console.log('✅ AI Assistant controller initialized with OpenAI API key');

// Test OpenAI connection
async function testOpenAIConnection() {
  try {
    // console.log('🟡 Testing OpenAI connection...');
    // console.log('🟡 OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    // console.log('🟡 OpenAI API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 7));
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message.'
        }
      ],
      max_tokens: 10,
      temperature: 0.7,
      stream: false
    });
    
    // console.log('✅ OpenAI connection test successful');
    // console.log('✅ Test response:', completion.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('❌ OpenAI connection test failed:', error.message);
    console.error('❌ OpenAI error details:', {
      status: error.status,
      type: error.type,
      code: error.code
    });
    
    // If it's a quota error, we can still start the agent with fallback responses
    if (error.status === 429 && error.code === 'insufficient_quota') {
      // console.log('🟡 OpenAI quota exceeded, but agent can start with fallback responses');
      return 'quota_exceeded';
    }
    
    return false;
  }
}

// Create AI assistant user in Stream
const createAIAssistantUser = async () => {
  try {
    await streamClient.upsertUsers([
      {
        id: 'ai-assistant',
        name: 'AI Assistant',
        image: 'https://getstream.io/random_svg/?id=ai-assistant',
        role: 'admin'
      }
    ]);
    // console.log('✅ AI Assistant user created in Stream');
  } catch (error) {
    console.error('❌ Error creating AI Assistant user:', error);
  }
};

// Initialize AI assistant user
createAIAssistantUser();

// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// Store active AI agents
const activeAgents = new Map();

// Export for webhook usage
export { activeAgents };

export const startAIAgent = async (req, res) => {
  try {
    // console.log('🟡 Starting AI agent with request body:', req.body);
    // console.log('🟡 Request headers:', req.headers);
    // console.log('🟡 User from middleware:', req.user);
    
    const { channelId, userId, platform = 'openai' } = req.body;

    if (!channelId || !userId) {
      // console.log('❌ Missing required parameters:', { channelId, userId });
      return res.status(400).json({
        success: false,
        message: 'Missing channelId or userId',
        received: { channelId, userId },
        body: req.body
      });
    }

    // console.log('✅ Parameters validated:', { channelId, userId, platform });

    // Improved check for active agents, especially after a server restart
    if (activeAgents.has(channelId)) {
      const existingAgent = activeAgents.get(channelId);
      // A running agent will have a pollInterval. If it exists, the agent is truly active.
      if (existingAgent.pollInterval) {
        // console.log('❌ AI agent is already active and running for channel:', channelId);
        return res.status(400).json({
          success: false,
          message: 'AI agent is already active for this channel',
        });
      }
      // If there's an entry without a pollInterval, it's a stale "zombie" agent from a previous session.
      // We should remove it and allow a new one to start.
      // console.warn('🟡 Found a stale AI agent entry (no pollInterval). Cleaning it up and starting a new one.');
      activeAgents.delete(channelId);
    }

    // console.log(`🟡 Starting AI agent for channel ${channelId} with platform ${platform}`);

    // Test OpenAI connection first
    let quotaExceeded = false;
    if (platform === 'openai') {
      const openaiTest = await testOpenAIConnection();
      if (openaiTest === 'quota_exceeded') {
        // console.log('🟡 OpenAI quota exceeded, starting agent with fallback responses');
        quotaExceeded = true;
      } else if (!openaiTest) {
        // console.log('❌ OpenAI connection test failed, cannot start AI agent');
        return res.status(500).json({
          success: false,
          message: 'OpenAI connection test failed. Please check your API key and try again.'
        });
      }
    }

    // Get the channel
    const channel = streamClient.channel('messaging', channelId);
    // console.log('🟡 Created Stream channel:', channel.id);
    
    await channel.watch();
    // console.log('🟡 Channel watched successfully');

    // Add AI assistant as a member to the channel
    try {
      await channel.addMembers(['ai-assistant']);
      // console.log('🟡 AI assistant added as channel member');
    } catch (error) {
      // console.log('🟡 AI assistant already a member or error adding:', error.message);
    }

    // Create AI agent configuration
    const agentConfig = {
      platform,
      channel,
      userId,
      isActive: true,
      processedMessages: new Set(),
      quotaExceeded
    };

    // Store the agent
    activeAgents.set(channelId, agentConfig);
    // console.log('🟡 AI agent stored in active agents');

    // Set up polling to check for new messages every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        // Get recent messages from the channel using the correct API
        const response = await channel.query({ messages: { limit: 10 } });
        const messages = response.messages || [];
        
        // console.log(`🟡 Polling channel ${channelId}, found ${messages.length} messages`);
        
        // Check for new user messages (not from ai-assistant)
        for (const message of messages) {
          // console.log(`🟡 Checking message: ${message.text} from user: ${message.user.id}`);
          
          if (message.user.id !== 'ai-assistant' && 
              !agentConfig.processedMessages.has(message.id)) {
            
            // console.log('🟡 Polling found new message:', message.text);
            agentConfig.processedMessages.add(message.id);
            
            // Process the message
            await handleUserMessage({
              type: 'message.new',
              message: message,
              user_id: message.user.id
            }, agentConfig);
          } else {
            // console.log(`🟡 Message already processed or from AI: ${message.id}`);
          }
        }
      } catch (error) {
        console.error('Error in polling:', error);
      }
    }, 3000);

    // Store the interval for cleanup
    agentConfig.pollInterval = pollInterval;

    // Send welcome message
    let welcomeText = `🤖 AI Assistant is now active! I'm ready to help you with any questions. I can assist with coding, writing, analysis, and much more.`;
    
    if (agentConfig.quotaExceeded) {
      welcomeText = `🤖 AI Assistant is now active! I'm currently running in fallback mode due to OpenAI API quota limits. I can still help with basic questions, but for full AI capabilities, please check your OpenAI billing settings at https://platform.openai.com/account/billing`;
    }
    
    const welcomeMessage = await channel.sendMessage({
      text: welcomeText,
      user_id: 'ai-assistant'
    });
    // console.log('🟡 Welcome message sent');
    
    // Add the welcome message to processed messages to prevent it from being processed
    if (welcomeMessage.message) {
      agentConfig.processedMessages.add(welcomeMessage.message.id);
      // console.log('🟡 Welcome message added to processed messages');
    }

    // console.log('✅ AI agent started successfully');
    res.json({
      success: true,
      message: 'AI agent started successfully'
    });

  } catch (error) {
    console.error('❌ Error starting AI agent:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error while starting AI agent',
      error: error.message,
    });
  }
};

export const stopAIAgent = async (req, res) => {
  try {
    const { channelId, userId } = req.body;
    // console.log(`🟡 Attempting to stop AI agent for channel: ${channelId}`);

    if (!channelId) {
      return res.status(400).json({ success: false, message: 'Missing channelId' });
    }

    const agent = activeAgents.get(channelId);

    // If an agent is found in memory, stop its polling loop.
    if (agent && agent.pollInterval) {
      // console.log(`🟡 Agent found in memory. Clearing polling interval for channel: ${channelId}`);
      clearInterval(agent.pollInterval);
    } else {
      // If not in memory (e.g., after a server restart), log it but proceed with cleanup.
      // console.warn(`🟡 Agent for channel ${channelId} not found in active memory. Proceeding with cleanup anyway.`);
    }

    // Always remove the agent from the in-memory map.
    activeAgents.delete(channelId);
    // console.log(`🟡 Agent removed from active map for channel: ${channelId}`);

    // Always attempt to remove the AI user from the Stream channel.
    // This ensures cleanup even if the server restarted and lost the in-memory state.
    const channel = streamClient.channel('messaging', channelId);
    try {
      await channel.removeMembers(['ai-assistant']);
      // console.log(`✅ AI assistant successfully removed from channel members: ${channelId}`);
    } catch (error) {
      // It's possible the member was already removed. This is not a critical error.
      // console.warn(`🟡 Could not remove AI assistant member from channel ${channelId} (may have already been removed):`, error.message);
    }
    
    // Send a final message confirming the agent has been stopped.
    await channel.sendMessage({
      text: '🤖 AI Assistant has been deactivated.',
      user_id: 'ai-assistant',
    });

    // console.log(`✅ AI agent stopped successfully for channel: ${channelId}`);
    res.json({ success: true, message: 'AI agent stopped successfully' });

  } catch (error) {
    console.error(`❌ Error stopping AI agent:`, error);
    res.status(500).json({ success: false, message: 'Internal server error while stopping agent' });
  }
};

export const getAIAgentStatus = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const isActive = activeAgents.has(channelId);
    
    res.json({
      success: true,
      isActive,
      message: isActive ? 'AI agent is active' : 'AI agent is inactive'
    });

  } catch (error) {
    console.error('Error getting AI agent status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI agent status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle user messages and generate AI responses following Stream tutorial pattern
export async function handleUserMessage(event, agentConfig) {
  const { channel, platform } = agentConfig;
  const userMessage = event.message.text;
  const messageId = event.message.id;

  // console.log(`🟡 Processing message: "${userMessage}" with platform: ${platform}`);
  // console.log(`🟡 Message ID: ${messageId}`);

  // Skip processing if message is empty or null
  if (!userMessage || userMessage.trim() === '') {
    // console.log('🟡 Skipping empty message');
    return;
  }

  try {
    // Generate AI response
    // console.log('🟡 Calling OpenAI API...');
    
    let aiResponse;
    if (agentConfig.quotaExceeded) {
      // console.log('🟡 Using fallback response due to quota exceeded');
      aiResponse = await generateFallbackResponse(userMessage);
    } else {
      aiResponse = await generateOpenAIResponse(userMessage);
    }
    
    // console.log('🟡 AI response received:', aiResponse.substring(0, 100) + '...');

    // Send the AI response as a new message
    const responseMessage = await channel.sendMessage({
      text: aiResponse,
      user_id: 'ai-assistant'
    });

    // Add the AI response to processed messages to prevent loops
    if (responseMessage.message) {
      agentConfig.processedMessages.add(responseMessage.message.id);
    }

    // console.log('🟡 AI response sent successfully');

  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Send error message only if it's not already an error message
    if (!userMessage.includes('⚠️ Sorry, I encountered an error')) {
      const errorResponse = await channel.sendMessage({
        text: '⚠️ Sorry, I encountered an error while processing your request. Please try again.',
        user_id: 'ai-assistant'
      });
      
      // Add the error message to processed messages to prevent loops
      if (errorResponse.message) {
        agentConfig.processedMessages.add(errorResponse.message.id);
      }
    }
  }
}

// Generate fallback response when OpenAI is not available
async function generateFallbackResponse(userMessage) {
  // console.log('🟡 Generating fallback response for:', userMessage);
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Simple keyword-based responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your AI assistant. I'm currently running in fallback mode due to API quota limits. I can still help with basic questions!";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I'm an AI assistant that can help with various tasks! Currently, I'm in fallback mode due to API quota limits. You can ask me about:\n• General questions\n• Basic coding help\n• Writing assistance\n• Analysis tasks\n\nTo get full AI capabilities, please check your OpenAI billing settings.";
  }
  
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('coding')) {
    return "I can help with coding questions! However, I'm currently in fallback mode due to API quota limits. For detailed code assistance, please check your OpenAI billing settings. You can still ask me basic programming questions!";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! I'm happy to help, even in fallback mode. Feel free to ask more questions!";
  }
  
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return "Goodbye! It was nice chatting with you. Come back anytime!";
  }
  
  // Default response
  return "I understand your question! I'm currently running in fallback mode due to OpenAI API quota limits. While I can't provide detailed AI responses right now, I can still help with basic questions. To get full AI capabilities, please check your OpenAI billing settings at https://platform.openai.com/account/billing";
}

// Generate response using OpenAI following Stream tutorial pattern
async function generateOpenAIResponse(userMessage) {
  // console.log('🟡 Generating OpenAI response for:', userMessage);
  // console.log('🟡 OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
  // console.log('🟡 OpenAI API Key length:', process.env.OPENAI_API_KEY?.length);
  
  try {
    // console.log('🟡 Creating OpenAI completion request...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant. You can help with coding, writing, analysis, and general questions. 
          Always provide clear, helpful responses. If you're writing code, use proper markdown formatting with syntax highlighting.
          Be friendly and engaging in your responses.`
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      stream: false
    });

    // console.log('🟡 OpenAI API call successful');
    // console.log('🟡 OpenAI response object:', completion);
    const response = completion.choices[0].message.content;
    // console.log('🟡 OpenAI response length:', response.length);
    // console.log('🟡 OpenAI response preview:', response.substring(0, 100));
    return response;
  } catch (error) {
    console.error('❌ OpenAI API error:', error);
    console.error('❌ OpenAI error message:', error.message);
    console.error('❌ OpenAI error status:', error.status);
    console.error('❌ OpenAI error type:', error.type);
    console.error('❌ OpenAI error code:', error.code);
    console.error('❌ OpenAI error details:', error.details);
    console.error('❌ OpenAI error response:', error.response);
    console.error('❌ OpenAI error stack:', error.stack);
    throw error;
  }
}

// Send an error message to the channel
async function sendErrorMessage(channel, errorMessage) {
  try {
    await channel.sendMessage({
      text: `⚠️ ${errorMessage}`,
      user_id: 'ai-assistant'
    });
  } catch (error) {
    console.error('Failed to send error message:', error);
  }
}

// Send AI state events to the frontend
async function sendAIStateEvent(channel, state) {
  try {
    await channel.sendEvent({
      type: 'ai.state',
      state: state,
    });
  } catch (error) {
    console.error(`Failed to send AI state event (${state}):`, error);
  }
}