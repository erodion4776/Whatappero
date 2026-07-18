'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import { Room } from '@/lib/types';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth');
      } else {
        setCurrentUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentRoom={currentRoom}
        onRoomSelect={setCurrentRoom}
        currentUser={currentUser}
      />

      {currentRoom ? (
        <ChatWindow room={currentRoom} currentUser={currentUser} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-dark-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-dark-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <MessageSquare size={40} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-light text-gray-300 mb-2">MyChat</h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Select a chat or click + to start a new conversation.
              Talk to Luna AI privately or use @luna in any group.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
