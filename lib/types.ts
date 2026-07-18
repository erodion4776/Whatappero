export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_bot: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  name: string | null;
  is_group: boolean;
  has_ai: boolean;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  joined_at: string;
  profiles?: Profile;
}
