'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data?.user) {
      setErrorMsg('Invalid email or password. Please try again.');
      return;
    }

    // Optionally fetch role
    const { data: userInfo, error: userInfoError } = await supabase
      .from('patients')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (userInfoError) {
      console.warn('Logged in, but failed to fetch user role.');
    }

    // Redirect to queue
    router.push('/queue');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow-md bg-white">
      <h2 className="text-3xl font-semibold mb-6 text-center">Login</h2>

      <input
        className="border p-3 w-full mb-4 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        className="border p-3 w-full mb-4 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button
        className="bg-blue-600 text-white py-2 px-4 w-full rounded hover:bg-blue-700 transition"
        onClick={handleLogin}
      >
        Login
      </button>

      {errorMsg && <p className="text-red-600 mt-3 text-center">{errorMsg}</p>}

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Not registered yet?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
