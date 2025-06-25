import React, { useState, useEffect, useRef } from 'react';
import { 
  StreamVideo, 
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  ParticipantsAudio,
  useCallStateHooks,
  useCall,
  ToggleAudioPublishingButton,
  CancelCallButton
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { fetchCallCredentials, joinCall } from '../lib/join';
// import { testWebRTCConnectivity } from '../lib/webrtc-test';
import { ShipWheelIcon, MicIcon, PhoneIcon, PhoneOff } from 'lucide-react';
import { AudioVisualizer } from '../components/AudioVisualizer';
import toast from 'react-hot-toast';
import useAuthUser from '../hooks/useAuthUser';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import PageHeader from '../components/PageHeader';

const VoiceAgentPage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [status, setStatus] = useState("start"); // "start" | "joining" | "joined"
  const [sessionId, setSessionId] = useState(null);
  const [connectionToken, setConnectionToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [joinedCallId, setJoinedCallId] = useState(null);
  const websocketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);

  const handleJoin = async () => {
    if (!authUser?._id) {
      toast.error('Please log in to use the voice agent');
      return;
    }

    setStatus("joining");
    try {
      // First, join the Stream call for UI purposes
      const credentials = await fetchCallCredentials();
      const [streamClient, streamCall] = await joinCall(credentials);
      
      setClient(streamClient);
      setCall(streamCall);
      setJoinedCallId(credentials.callId);
      
      // Then, create OpenAI session (either Realtime API or Stream integration)
      const response = await axiosInstance.post('/voice-agent/join-call', {
        callId: credentials.callId,
        userId: credentials.userId
      });
      
      if (response.data.success) {
        if (response.data.sessionId && !response.data.fallback) {
          // Use OpenAI Realtime API
          setSessionId(response.data.sessionId);
          
          // Get connection token
          const connectionResponse = await axiosInstance.get(`/voice-agent/realtime-connection/${response.data.sessionId}`);
          
          if (connectionResponse.data.success) {
            setConnectionToken(connectionResponse.data.connectionToken);
            await connectToOpenAI(connectionResponse.data.connectionToken);
          }
        } else {
          // Use Stream's OpenAI integration (fallback)
          // console.log('Using Stream OpenAI integration (fallback)');
          setIsConnected(true); // Mark as connected for UI purposes
        }
      }
      
      setStatus("joined");
      toast.success('Connected to voice agent!');
    } catch (error) {
      console.error('Could not join call', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join call';
      toast.error(errorMessage);
      setStatus("start");
    }
  };

  const connectToOpenAI = async (token) => {
    try {
      // Create WebSocket connection to OpenAI
      const ws = new WebSocket(`wss://api.openai.com/v1/realtime/connections/${token}`);
      
      ws.onopen = () => {
        // console.log('✅ Connected to OpenAI Realtime API');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        // console.log('OpenAI Event:', data);
        
        if (data.type === 'audio_response') {
          // Handle audio response from Lucy
          playAudioResponse(data.audio);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error');
      };
      
      ws.onclose = () => {
        // console.log('WebSocket connection closed');
        setIsConnected(false);
      };
      
      websocketRef.current = ws;
      
      // Start audio recording
      await startAudioRecording(ws);
      
    } catch (error) {
      console.error('Error connecting to OpenAI:', error);
      toast.error('Failed to connect to OpenAI');
    }
  };

  const startAudioRecording = async (ws) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context for processing
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const audioData = event.inputBuffer.getChannelData(0);
        
        // Send audio data to OpenAI
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'audio_input',
            audio: Array.from(audioData)
          }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (error) {
      console.error('Error starting audio recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const playAudioResponse = (audioData) => {
    try {
      const audioContext = audioContextRef.current;
      const audioBuffer = audioContext.createBuffer(1, audioData.length, 16000);
      audioBuffer.getChannelData(0).set(audioData);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio response:', error);
    }
  };

  const handleLeave = () => {
    // Close WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Leave Stream call
    if (call) {
      call.leave();
    }
    if (client) {
      client.disconnectUser();
    }
    
    setClient(null);
    setCall(null);
    setSessionId(null);
    setConnectionToken(null);
    setJoinedCallId(null);
    setIsConnected(false);
    setStatus("start");
    toast.success('Call ended');
  };

  // Test greeting - commented out for now
  /*
  const testLucyGreeting = async () => {
    try {
      // console.log('🧪 Testing Lucy greeting...');
      // console.log('🧪 Joined Call ID:', joinedCallId);
      // console.log('🧪 Stream Call ID:', call?.id);
      // console.log('🧪 User ID:', authUser?._id);
      
      const requestData = {
        callId: joinedCallId,
        userId: authUser?._id
      };
      
      // console.log('🧪 Sending request data:', requestData);
      
      const response = await axiosInstance.post('/voice-agent/test-greeting', requestData);
      
      if (response.data.success) {
        // console.log('🧪 Test greeting sent successfully');
        toast.success('Test greeting sent to Lucy');
      }
    } catch (error) {
      console.error('Error testing Lucy greeting:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to test greeting');
    }
  };
  */

  // Test ICE connectivity - commented out for now
  /*
  const testIceConnectivity = async () => {
    try {
      // console.log('🧪 Testing ICE connectivity...');
      const result = await testWebRTCConnectivity();
      if (result) {
        toast.success('ICE connectivity test completed - check console for details');
      } else {
        toast.error('ICE connectivity test failed');
      }
    } catch (error) {
      console.error('Error testing ICE connectivity:', error);
      toast.error('Failed to test ICE connectivity');
    }
  };
  */

  // Test backend health - commented out for now
  /*
  const testBackendHealth = async () => {
    try {
      // console.log('🏥 Testing backend health...');
      const response = await axiosInstance.get('/voice-agent/health');
      // console.log('Backend health response:', response.data);
      toast.success('Backend is healthy!');
    } catch (error) {
      console.error('Backend health check failed:', error);
      toast.error('Backend health check failed');
    }
  };
  */

  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (call) {
        call.leave();
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [call, client]);

  if (!authUser) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
          <p className="mb-4">You need to be logged in to use the voice agent.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <PageHeader title="Voice Agent" />
      {status === "start" && (
        <div className="flex items-center justify-center h-full">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center mb-8">
              <ShipWheelIcon className="size-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Voice Agent</h1>
              <p className="text-gray-600">
                Talk to Lucy, your AI assistant for Streamify
              </p>
            </div>

            <div className="bg-base-100 rounded-lg p-6 shadow-lg">
              <div className="text-center mb-6">
                <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MicIcon className="size-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Start Conversation</h2>
                <p className="text-sm text-gray-600">
                  Click the button below to start talking with Lucy
                </p>
              </div>

              <button
                onClick={handleJoin}
                className="btn btn-primary w-full"
              >
                <PhoneIcon className="size-5" />
                Click to Talk to AI
              </button>
              
              {/* Test buttons commented out for now */}
              {/*
              <button
                onClick={testIceConnectivity}
                className="btn btn-outline btn-sm w-full mt-2"
              >
                Test ICE Connectivity
              </button>
              
              <button
                onClick={testBackendHealth}
                className="btn btn-outline btn-sm w-full mt-2"
              >
                Test Backend Health
              </button>
              */}
            </div>
          </div>
        </div>
      )}

      {status === "joining" && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
            <p className="text-gray-600">Setting up voice agent...</p>
          </div>
        </div>
      )}

      {client && call && (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <CallLayout 
              onLeave={handleLeave} 
              isConnected={isConnected}
              // onTestGreeting={testLucyGreeting}
              // onTestIce={testIceConnectivity}
              // onTestHealth={testBackendHealth}
            />
          </StreamCall>
        </StreamVideo>
      )}
    </div>
  );
};

function CallLayout({ onLeave, isConnected }) {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  // Filter out duplicate participants by userId
  const uniqueParticipants = Array.from(
    new Map(participants.map(p => [p.userId, p])).values()
  );

  // Add debugging information
  useEffect(() => {
    // console.log('Call participants:', uniqueParticipants);
    // console.log('Call state:', call?.state);
    // console.log('Call ID:', call?.id);
    // console.log('OpenAI Connected:', isConnected);
    
    // Log when participants change
    // uniqueParticipants.forEach(participant => {
    //   console.log(`Participant: ${participant.userId}, isSpeaking: ${participant.isSpeaking}, hasAudio: ${!!participant.audioStream}`);
    // });
  }, [uniqueParticipants, call, isConnected]);

  return (
    <>
      <StreamTheme>
        <ParticipantsAudio participants={uniqueParticipants} />
        <div className="call-controls">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <ToggleAudioPublishingButton />
              <button
                onClick={() => {
                  call?.endCall();
                  onLeave?.();
                }}
                className="btn btn-error btn-circle !bg-red-600 hover:!bg-red-700"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
            
            {/* Test buttons commented out for now */}
            {/*
            <div className="flex space-x-4">
              <button
                onClick={onTestGreeting}
                className="btn btn-outline btn-sm"
              >
                Test Greeting
              </button>
              
              <button
                onClick={onTestIce}
                className="btn btn-outline btn-sm"
              >
                Test ICE
              </button>
              
              <button
                onClick={onTestHealth}
                className="btn btn-outline btn-sm"
              >
                Test Health
              </button>
            </div>
            */}
          </div>
        </div>
      </StreamTheme>
      <AudioVisualizer />
      
      {/* Debug info */}
      <div className="fixed top-4 left-4 bg-black/80 text-white p-4 rounded-lg text-sm z-50">
        <div>Participants: {uniqueParticipants.length}</div>
        <div>Call State: {call?.state?.toString?.() || 'Unknown'}</div>
        <div>Call ID: {call?.id || 'Unknown'}</div>
        <div>OpenAI Connected: {isConnected ? '✅' : '❌'}</div>
        {uniqueParticipants.map(p => (
          <div key={p.userId}>
            {p.userId}: {p.isSpeaking ? 'Speaking' : 'Silent'} {p.audioStream ? '🎤' : '🔇'}
          </div>
        ))}
      </div>
    </>
  );
}

export default VoiceAgentPage; 