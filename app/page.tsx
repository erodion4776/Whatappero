'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/chat');
      } else {
        router.push('/auth');
      }
    });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-dark-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">💬</span>
        </div>
        <p className="text-gray-400">Loading MyChat...</p>
      </div>
    </div>
  );
}
