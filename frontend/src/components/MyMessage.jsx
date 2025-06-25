import { Avatar } from 'stream-chat-react';
import useAuthUser from '../hooks/useAuthUser';
import { Bot } from "lucide-react";

export default function MyMessage(props) {
  const { message } = props;
  const { authUser } = useAuthUser();

  // Guard against incomplete message object
  if (!message?.user) {
    return null;
  }

  const isAIMessage = message.user.id.includes('ai-assistant');

  return (
    <div className={`flex items-start gap-3 my-4 ${!isAIMessage && 'flex-row-reverse'}`}>
      {/* AVATAR */}
      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-700">
        {isAIMessage ? (
          <Bot className="w-6 h-6 text-slate-300" />
        ) : (
          // Also guard against authUser being temporarily undefined
          authUser && <Avatar image={authUser.profilePic} name={authUser.fullName} />
        )}
      </div>

      {/* MESSAGE BUBBLE */}
      <div className="text-sm p-3 rounded-lg bg-slate-700 max-w-lg" style={{ color: '#e2e8f0' }}>
        <p className='whitespace-pre-wrap' style={{ color: '#e2e8f0' }}>
          {message.text}
        </p>
      </div>
    </div>
  );
} 