import { useChannelStateContext } from 'stream-chat-react';
import { axiosInstance } from '../lib/axios';
import useAuthUser from '../hooks/useAuthUser';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MyChannelHeader() {
  const { channel } = useChannelStateContext();

  async function clearChatHistory() {
    if (!channel) return;
    const isConfirmed = window.confirm(
      'Are you sure you want to delete all messages in this chat?'
    );

    if (isConfirmed) {
      try {
        await channel.truncate();
        toast.success('Chat history cleared');
      } catch (error) {
        toast.error('Failed to clear chat history.');
      }
    }
  }

  return (
    <div className='flex items-center justify-between p-3 bg-base-200 border-b border-base-300 shadow-sm'>
      <h2 className='font-semibold text-lg'>{channel?.data?.name || "Chat"}</h2>

      <div className='flex items-center gap-4'>
        <button
          onClick={clearChatHistory}
          className='btn btn-ghost btn-circle text-slate-400 hover:text-red-500 hover:bg-red-500/10'
          title='Clear Chat History'
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
} 