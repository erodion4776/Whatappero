import { Message } from '@/lib/types';
import { AI_USER_ID, AI_NAME } from '@/lib/supabase';
import { format } from 'date-fns';

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const isAI = message.sender_id === AI_USER_ID;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name (not for own messages) */}
        {!isOwn && (
          <span className={`text-xs mb-1 px-2 ${isAI ? 'text-purple-400' : 'text-primary'}`}>
            {isAI ? '🤖 ' + AI_NAME : message.profiles?.full_name || 'Unknown'}
          </span>
        )}

        <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed
          ${isOwn ? 'message-out text-white' : isAI ? 'message-ai text-white' : 'message-in text-white'}
        `}>
          {message.content}
        </div>

        <span className="text-xs text-gray-600 mt-1 px-2">
          {format(new Date(message.created_at), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}
