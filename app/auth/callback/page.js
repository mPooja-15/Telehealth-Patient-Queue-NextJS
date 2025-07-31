'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleSession = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error('Session exchange error:', error.message);
      }
      router.replace('/register'); // or '/queue' if already registered
    };

    handleSession();
  }, []);

  return <p className="p-4">Logging in...</p>;
}
