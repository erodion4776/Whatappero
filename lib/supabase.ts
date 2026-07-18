import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AI_USER_ID = '00000000-0000-0000-0000-000000000001';
export const AI_NAME = 'Luna AI';
// Sentinel `rooms.name` value used to identify each user's private 1:1 Luna room.
export const LUNA_DIRECT_NAME = '__luna_direct__';
