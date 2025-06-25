# Voice Agent Setup Guide

This guide will help you set up the AI Voice Agent feature for Streamify using Stream's Video SDK and OpenAI's Realtime API.

## Prerequisites

1. **Stream Account**: Sign up at [getstream.io](https://getstream.io) and get your API keys
2. **OpenAI Account**: Sign up at [openai.com](https://openai.com) and get your API key
3. **Node.js**: Version 18 or later

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/streamify

# JWT
JWT_SECRET=your_jwt_secret_here

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Stream Chat
STREAM_API_KEY=your_stream_chat_api_key
STREAM_API_SECRET=your_stream_chat_api_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Node Environment
NODE_ENV=development
```

## Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_STREAM_API_KEY=your_stream_api_key
VITE_STREAM_API_SECRET=your_stream_api_secret
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Installation

1. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```

## How to Use

1. Sign up or log in to your Streamify account
2. Navigate to the "Voice Agent" section in the sidebar
3. Click "Start Call" to initialize the voice agent
4. Allow microphone permissions when prompted
5. Start talking to Lucy, your AI assistant!

## Features

- **Real-time Voice Conversation**: Talk naturally with the AI assistant
- **Audio Visualization**: Beautiful visual feedback during conversations
- **Customizable Instructions**: Modify the AI's behavior and responses
- **WebRTC Support**: Works even with poor network connections
- **Secure**: API keys are handled server-side

## Troubleshooting

### Common Issues

1. **Microphone Not Working**:
   - Check browser permissions
   - Ensure microphone is not being used by other applications
   - Try refreshing the page

2. **API Key Errors**:
   - Verify all environment variables are set correctly
   - Check that your Stream and OpenAI accounts are active
   - Ensure you have sufficient credits in your OpenAI account

3. **Connection Issues**:
   - Check your internet connection
   - Verify the backend server is running
   - Check browser console for error messages

### Getting Help

If you encounter any issues, check the browser console and backend server logs for error messages. The improved error handling should provide specific information about what's going wrong.

## API Endpoints

- `POST /api/voice-agent/initialize` - Initialize the voice agent
- `POST /api/voice-agent/token` - Get call token for joining
- `POST /api/voice-agent/end` - End the current call
- `PUT /api/voice-agent/instructions` - Update agent instructions

## Security Notes

- API keys are never exposed to the frontend
- All sensitive operations happen server-side
- User authentication is required for all voice agent endpoints
- Calls are automatically cleaned up when ended

## Credits

This implementation is based on the [Stream AI Voice Assistant Tutorial](https://getstream.io/video/sdk/react/tutorial/ai-voice-assistant/). 