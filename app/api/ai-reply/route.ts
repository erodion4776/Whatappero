import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const AI_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(req: NextRequest) {
  try {
    const { roomId, userMessage, history, isGroup } = await req.json();

    if (!roomId || !userMessage) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Build message history for AI context
    const messages = [
      {
        role: 'system' as const,
        content: `You are Luna, a friendly, helpful and smart AI assistant embedded in a private chat app called MyChat.
        ${isGroup ? 'You are in a group chat. Someone mentioned you with @luna.' : 'You are in a private chat with one person.'}
        Keep your responses natural, warm, and concise (1-3 sentences unless more detail is needed).
        You can help with questions, have casual conversations, give advice, write things, solve problems, and more.
        Never say you are ChatGPT or any other AI. You are Luna.`,
      },
      ...history.slice(-12),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages,
      max_tokens: 500,
      temperature: 0.8,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      throw new Error('No reply from AI');
    }

    // Save AI message to database
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: AI_USER_ID,
      content: reply,
    });

    if (error) throw error;

    return Response.json({ success: true, reply });
  } catch (error: any) {
    console.error('AI reply error:', error);
    return Response.json(
      { error: error.message || 'AI reply failed' },
      { status: 500 }
    );
  }
}
