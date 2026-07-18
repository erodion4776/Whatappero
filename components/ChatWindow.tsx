'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase, AI_USER_ID, AI_NAME } from '@/lib/supabase';
import { Message, Room } from '@/lib/types';
import MessageBubble from './MessageBubble';
import { Send, Bot } from 'lucide-react';

interface Props {
  room: Room;
  currentUser: any;
}

export default function ChatWindow({ room, currentUser }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`room:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(full_name, username, avatar_url)')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) setMessages(data as Message[]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    const messageText = newMessage;
    setNewMessage('');
    setLoading(true);

    try {
      // Insert user message
      await supabase.from('messages').insert({
        room_id: room.id,
        sender_id: currentUser.id,
        content: messageText,
      });

      // Check if AI should reply
      const shouldAIReply =
        room.id === 'luna-direct' ||
        messageText.toLowerCase().includes('@luna') ||
        room.has_ai;

      if (shouldAIReply) {
        setAiTyping(true);

        // Get recent message history
        const history = messages.slice(-15).map(m => ({
          role: m.sender_id === AI_USER_ID ? 'assistant' : 'user',
          content: m.content,
        }));

        const response = await fetch('/api/ai-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: room.id,
            userMessage: messageText,
            history,
            isGroup: room.is_group,
          }),
        });

        if (!response.ok) throw new Error('AI reply failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setAiTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-dark-100">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-dark-200 border-b border-dark-300 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
          ${room.id === 'luna-direct' ? 'bg-purple-700' : room.is_group ? 'bg-blue-700' : 'bg-green-700'}`}>
          {room.id === 'luna-direct' ? '🤖' : room.is_group ? '👥' : '👤'}
        </div>
        <div>
          <p className="font-semibold">{room.name || (room.id === 'luna-direct' ? AI_NAME : 'Private Chat')}</p>
          <p className="text-xs text-gray-400">
            {room.id === 'luna-direct' ? 'AI Assistant • Always Online' :
              room.is_group ? 'Group • @luna for AI help' : 'Private Chat'}
          </p>
        </div>

        {room.has_ai && room.id !== 'luna-direct' && (
          <div className="ml-auto flex items-center gap-1 text-purple-400 text-xs bg-purple-900/30 px-3 py-1 rounded-full">
            <Bot size={12} />
            Luna Active
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === currentUser.id}
          />
        ))}

        {aiTyping && (
          <div className="flex justify-start mb-2">
            <div className="message-ai px-4 py-3 rounded-2xl flex items-center gap-2">
              <span className="text-xs text-purple-300">🤖 Luna is typing</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-dark-200 border-t border-dark-300">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-dark-300 rounded-full px-6 py-3 flex items-center">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={room.is_group ? "Type @luna for AI..." : "Type a message..."}
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-sm"
              disabled={loading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            className="w-12 h-12 bg-primary hover:bg-green-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
        {room.is_group && (
          <p className="text-center text-xs text-gray-600 mt-2">
            Use @luna to get AI responses in the group
          </p>
        )}
      </div>
    </div>
  );
}
