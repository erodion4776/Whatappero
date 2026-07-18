'use client';
import { useEffect, useState } from 'react';
import { supabase, AI_USER_ID, AI_NAME, LUNA_DIRECT_NAME } from '@/lib/supabase';
import { Room, Profile } from '@/lib/types';
import { MessageSquare, Users, Plus, LogOut, Search } from 'lucide-react';

interface Props {
  currentRoom: Room | null;
  onRoomSelect: (room: Room) => void;
  currentUser: any;
}

export default function Sidebar({ currentRoom, onRoomSelect, currentUser }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lunaRoom, setLunaRoom] = useState<Room | null>(null);
  const [lunaLoading, setLunaLoading] = useState(false);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRooms();
    getOrCreateLunaRoom();

    // Realtime room updates
    const channel = supabase
      .channel('rooms-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('room_members')
      .select('room_id, rooms(*)')
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('fetchRooms error:', error);
      return;
    }

    if (data) {
      const roomList = data
        .map((d: any) => d.rooms)
        .filter(Boolean)
        // The Luna direct room is rendered separately as the pinned row above,
        // so don't show it again in the regular room list.
        .filter((r: Room) => r.name !== LUNA_DIRECT_NAME);
      setRooms(roomList);
    }
  };

  // A real, persisted 1:1 room with Luna AI (instead of a fake client-side id
  // that was never written to the `rooms` table — that's what was causing
  // messages sent to "Luna direct" to silently fail to save and vanish).
  const getOrCreateLunaRoom = async () => {
    setLunaLoading(true);
    try {
      // 1. Look for an existing Luna direct room owned by this user
      const { data: existing, error: findError } = await supabase
        .from('rooms')
        .select('*')
        .eq('created_by', currentUser.id)
        .eq('name', LUNA_DIRECT_NAME)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        setLunaRoom(existing);
        return;
      }

      // 2. None found — create it
      const { data: room, error: createError } = await supabase
        .from('rooms')
        .insert({
          name: LUNA_DIRECT_NAME,
          is_group: false,
          created_by: currentUser.id,
          has_ai: true,
        })
        .select()
        .single();

      if (createError || !room) throw createError;

      const { error: memberError } = await supabase.from('room_members').insert([
        { room_id: room.id, user_id: currentUser.id },
        { room_id: room.id, user_id: AI_USER_ID },
      ]);
      if (memberError) throw memberError;

      const { error: msgError } = await supabase.from('messages').insert({
        room_id: room.id,
        sender_id: AI_USER_ID,
        content: `Hey there! 👋 I'm Luna, your personal AI assistant. Ask me anything or just chat! 😊`,
      });
      if (msgError) console.error('Luna welcome message error:', msgError);

      setLunaRoom(room);
    } catch (err: any) {
      console.error('getOrCreateLunaRoom error:', err);
      setErrorMsg(err?.message || 'Could not start Luna chat. Check your Supabase permissions.');
    } finally {
      setLunaLoading(false);
    }
  };

  const createRoom = async () => {
    setErrorMsg('');

    if (isGroup && !newRoomName.trim()) {
      setErrorMsg('Please enter a group name.');
      return;
    }

    setLoading(true);
    let createdRoomId: string | null = null;

    try {
      // If an invite username was given, resolve it first so we fail fast
      // with a clear message instead of silently creating an empty room.
      let inviteeId: string | null = null;
      if (inviteUsername.trim()) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', inviteUsername.toLowerCase().trim())
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
          throw new Error(`No user found with username "${inviteUsername.trim()}".`);
        }
        inviteeId = profile.id;
      }

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: isGroup ? newRoomName.trim() : null,
          is_group: isGroup,
          created_by: currentUser.id,
          has_ai: true,
        })
        .select()
        .single();

      if (roomError) throw roomError;
      if (!room) throw new Error('Room was not created.');
      createdRoomId = room.id;

      // Add current user
      const { error: selfMemberError } = await supabase.from('room_members').insert({
        room_id: room.id,
        user_id: currentUser.id,
      });
      if (selfMemberError) throw selfMemberError;

      // Add AI bot automatically
      const { error: aiMemberError } = await supabase.from('room_members').insert({
        room_id: room.id,
        user_id: AI_USER_ID,
      });
      if (aiMemberError) throw aiMemberError;

      // Add invited user, if any
      if (inviteeId) {
        const { error: inviteeMemberError } = await supabase.from('room_members').insert({
          room_id: room.id,
          user_id: inviteeId,
        });
        if (inviteeMemberError) throw inviteeMemberError;
      }

      // Add welcome message from AI (non-fatal if it fails)
      const { error: msgError } = await supabase.from('messages').insert({
        room_id: room.id,
        sender_id: AI_USER_ID,
        content: isGroup
          ? `Welcome to ${newRoomName}! 👋 I'm Luna, your AI assistant. I'm here to help! Just type @luna to talk to me.`
          : `Hey there! 👋 I'm Luna, your personal AI assistant. Ask me anything or just chat! 😊`,
      });
      if (msgError) console.error('Welcome message error:', msgError);

      setShowNewRoom(false);
      setNewRoomName('');
      setInviteUsername('');
      fetchRooms();
      onRoomSelect(room);
    } catch (err: any) {
      console.error('createRoom error:', err);
      // Clean up a partially-created room so retries don't leave orphaned rows
      if (createdRoomId) {
        await supabase.from('rooms').delete().eq('id', createdRoomId);
      }
      setErrorMsg(
        err?.message ||
          'Could not create the chat. This is usually a Supabase Row Level Security (RLS) permissions issue — see the notes below the form.'
      );
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const filteredRooms = rooms.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    searchQuery === ''
  );

  return (
    <div className="w-80 bg-dark-200 flex flex-col h-screen border-r border-dark-300">
      {/* Header */}
      <div className="p-4 bg-dark-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
            {currentUser?.email?.[0]?.toUpperCase()}
          </div>
          <span className="font-semibold text-sm">MyChat</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewRoom(true)}
            className="p-2 hover:bg-dark-400 rounded-full transition-colors text-gray-400 hover:text-white"
            title="New Chat"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={signOut}
            className="p-2 hover:bg-dark-400 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="bg-dark-300 rounded-full flex items-center px-4 py-2 gap-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="bg-transparent text-sm outline-none flex-1 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewRoom && (
        <div className="mx-3 mb-3 bg-dark-300 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm">New Conversation</h3>

          {errorMsg && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 rounded-lg p-2 text-xs">
              ❌ {errorMsg}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setIsGroup(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!isGroup ? 'bg-primary text-white' : 'bg-dark-400 text-gray-400'}`}
            >
              💬 Private
            </button>
            <button
              onClick={() => setIsGroup(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isGroup ? 'bg-primary text-white' : 'bg-dark-400 text-gray-400'}`}
            >
              👥 Group
            </button>
          </div>

          {isGroup && (
            <input
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder="Group name"
              className="w-full bg-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          )}

          <input
            value={inviteUsername}
            onChange={e => setInviteUsername(e.target.value)}
            placeholder="Invite by username (optional)"
            className="w-full bg-dark-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setShowNewRoom(false)}
              className="flex-1 py-2 bg-dark-400 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={createRoom}
              disabled={loading}
              className="flex-1 py-2 bg-primary rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {/* Luna AI always at top */}
        <div
          className={`flex items-center gap-3 px-4 py-3 transition-colors ${lunaLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-dark-300'} ${currentRoom && lunaRoom && currentRoom.id === lunaRoom.id ? 'bg-dark-300' : ''}`}
          onClick={() => {
            if (lunaRoom) onRoomSelect(lunaRoom);
          }}
        >
          <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center text-xl">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <p className="font-medium text-sm">{AI_NAME}</p>
              <span className="text-xs text-primary">AI</span>
            </div>
            <p className="text-xs text-gray-400 truncate">
              {lunaLoading ? 'Setting up...' : 'Chat with your AI assistant'}
            </p>
          </div>
        </div>

        <div className="h-px bg-dark-300 mx-4" />

        {filteredRooms.map(room => (
          <div
            key={room.id}
            onClick={() => onRoomSelect(room)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-300 transition-colors ${currentRoom?.id === room.id ? 'bg-dark-300' : ''}`}
          >
            <div className={`w-12 h-12 ${room.is_group ? 'bg-blue-700' : 'bg-green-700'} rounded-full flex items-center justify-center text-xl`}>
              {room.is_group ? '👥' : '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <p className="font-medium text-sm truncate">{room.name || 'Private Chat'}</p>
                {room.is_group && (
                  <span className="text-xs text-blue-400 flex items-center gap-1">
                    <Users size={10} /> Group
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">Tap to open</p>
            </div>
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="text-center py-12 px-4">
            <MessageSquare size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No chats yet</p>
            <p className="text-gray-600 text-xs mt-1">Click + to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
