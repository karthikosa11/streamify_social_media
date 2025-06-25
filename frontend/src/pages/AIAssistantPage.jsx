import { useEffect, useState, useRef } from 'react';
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Window,
  useChannelStateContext,
  useChannelActionContext,
} from 'stream-chat-react';
import { useCreateChatClient } from 'stream-chat-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getStreamToken, startAIAgent } from '../lib/api';
import PageLoader from '../components/PageLoader';
import useAuthUser from '../hooks/useAuthUser';
import MyChannelHeader from '../components/MyChannelHeader';
import MyMessage from '../components/MyMessage';
import { MessageSquare, Plus, Send, Bot, Sparkles, X } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import MyAIStateIndicator from '../components/MyAIStateIndicator';
import PageHeader from '../components/PageHeader';
import { toast } from 'react-hot-toast';

const VITE_STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const EmptyStateIndicator = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
    <div className="w-16 h-16 flex items-center justify-center bg-slate-700 rounded-xl mb-4">
      <MessageSquare size={32} />
    </div>
    <p className="text-sm font-medium">No chats here yet...</p>
  </div>
);

const AIActivationButton = ({ onActivate, isLoading }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-base-content">
    <div className="w-24 h-24 flex items-center justify-center bg-primary/10 rounded-full mb-6">
      <Bot className="size-12 text-primary" />
    </div>
    <h2 className="text-2xl font-bold mb-4 text-base-content">AI Assistant</h2>
    <p className="text-base-content/70 text-center mb-8 max-w-md">
      Your personal AI assistant is ready to help! Click the button below to start a conversation.
    </p>
    <button
      onClick={onActivate}
      disabled={isLoading}
      className="btn btn-primary btn-lg gap-3 hover:scale-105 transition-transform disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <div className="loading loading-spinner loading-sm"></div>
          Activating AI...
        </>
      ) : (
        <>
          <Sparkles className="size-5" />
          Activate AI Assistant
        </>
      )}
    </button>
  </div>
);

const CustomMessageInput = () => {
  const { sendMessage } = useChannelActionContext();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (text.trim()) {
        sendMessage({ text });
        setText('');
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (text.trim()) {
      sendMessage({ text });
      setText('');
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  return (
    <form className="p-4 shrink-0 bg-base-200 border-t border-base-300" onSubmit={handleSubmit}>
      <div className="flex items-center bg-base-100 rounded-xl p-2 border border-base-300">
        <button type="button" className="text-base-content/60 p-2 hover:text-base-content transition-colors">
          <Plus size={24} />
        </button>
        <textarea
          ref={textareaRef}
          className="flex-1 bg-transparent border-none text-base-content resize-none outline-none p-2 placeholder-base-content/50"
          placeholder="Type your message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button type="submit" className="bg-primary rounded-lg p-2 text-primary-content hover:bg-primary-focus transition-colors">
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};

const CustomChannelHeader = ({ onStopAI }) => (
  <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-100">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <Bot className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="font-semibold text-base-content">AI Assistant</h2>
        <p className="text-sm text-base-content/70">Active and ready to help</p>
      </div>
    </div>
    <button
      onClick={onStopAI}
      className="btn btn-outline btn-sm btn-error gap-2"
      title="Stop AI Assistant"
    >
      <X className="w-4 h-4" />
      Stop AI
    </button>
  </div>
);

function ChatComponent({ tokenData, authUser, theme }) {
  const [channel, setChannel] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [messages, setMessages] = useState([]);

  const client = useCreateChatClient({
    apiKey: VITE_STREAM_API_KEY,
    tokenOrProvider: tokenData.token,
    userData: {
      id: authUser._id,
      name: authUser.username,
      image: authUser.profilePic,
    },
  });

  // Mutation to start AI agent
  const startAIAgentMutation = useMutation({
    mutationFn: ({ channelId, userId }) => startAIAgent(channelId, userId),
    onSuccess: () => {
      toast.success('AI Assistant activated successfully!');
      setIsActivated(true);
    },
    onError: (error) => {
      console.error('Error starting AI agent:', error);
      toast.error('Failed to activate AI Assistant. Please try again.');
    },
  });

  useEffect(() => {
    if (!client || !authUser) return;

    const channel = client.channel('messaging', `ai-assistant-${authUser._id}`, {
      name: 'AI Assistant',
    });

    setChannel(channel);
  }, [client, authUser]);

  // Listen for messages to determine if AI is activated
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (event) => {
      setMessages(prev => [...prev, event.message]);
      if (!isActivated) {
        setIsActivated(true);
      }
    };

    channel.on('message.new', handleNewMessage);

    // Check existing messages
    channel.watch().then(() => {
      const existingMessages = channel.state.messages;
      setMessages(Object.values(existingMessages));
      if (existingMessages && Object.keys(existingMessages).length > 0) {
        setIsActivated(true);
      }
    });

    return () => {
      channel.off('message.new', handleNewMessage);
    };
  }, [channel, isActivated]);

  // Cleanup effect for proper disconnection
  useEffect(() => {
    return () => {
      if (client) {
        // console.log('Cleaning up Stream client connection');
        client.disconnectUser();
      }
    };
  }, [client]);

  const handleActivateAI = async () => {
    if (channel) {
      try {
        // console.log('🟡 Activating AI with data:', {
        //   channelId: channel.id,
        //   userId: authUser._id
        // });
        
        const result = await startAIAgentMutation.mutateAsync({
          channelId: channel.id,
          userId: authUser._id,
        });
        
        // console.log('✅ AI activation result:', result);
      } catch (error) {
        console.error('❌ Error activating AI:', error);
        console.error('❌ Error response data:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error headers:', error.response?.headers);
      }
    }
  };

  const handleStopAI = async () => {
    try {
      // Clear all messages from the channel
      if (channel) {
        await channel.truncate();
        setMessages([]);
      }
      
      // Reset activation state
      setIsActivated(false);
      
      toast.success('AI Assistant stopped. Conversation cleared.');
    } catch (error) {
      console.error('Error stopping AI:', error);
      toast.error('Failed to stop AI Assistant');
    }
  };

  if (!client || !channel) {
    return <PageLoader />;
  }

  // Show activation button if not activated yet
  if (!isActivated) {
    return (
      <div className="flex-1 flex flex-col h-screen bg-base-100">
        <PageHeader title="AI Assistant" />
        <AIActivationButton 
          onActivate={handleActivateAI} 
          isLoading={startAIAgentMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-base-100">
      <PageHeader title="AI Assistant" />
      <Chat client={client} theme="str-chat__theme-dark">
        <Channel
          channel={channel}
          TypingIndicator={MyAIStateIndicator}
          EmptyStateIndicator={EmptyStateIndicator}
        >
          <Window>
            <CustomChannelHeader onStopAI={handleStopAI} />
            <MessageList />
            <MessageInput Input={CustomMessageInput} />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
}

export default function AIAssistantPage() {
  const { authUser } = useAuthUser();
  const { theme } = useThemeStore();

  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  if (tokenLoading || !tokenData?.token || !authUser) {
    return <PageLoader />;
  }

  return (
    <div className='w-full h-full'>
      <ChatComponent 
        tokenData={tokenData} 
        authUser={authUser} 
        theme={theme} 
      />
    </div>
  );
} 