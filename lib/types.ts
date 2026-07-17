export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  has_ai: boolean;
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
  profiles?: Profile;
}
