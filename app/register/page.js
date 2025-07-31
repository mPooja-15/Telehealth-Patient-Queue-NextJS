'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    setErrorMsg('');

    if (!fullName || !dob || !email || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    // Step 1: Sign up using Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          dob,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      setErrorMsg('User registration failed.');
      return;
    }

    // Step 2: Insert into patients table
    const { error: insertError } = await supabase.from('patients').insert([
      {
        id: userId,      // Auth UID as PK
        name: fullName,
        dob,
        email: email.trim(), // optional if needed for reference
        role: 'patient',
      },
    ]);

    if (insertError) {
      setErrorMsg('Account created but failed to save patient details.');
      return;
    }

    router.push('/login');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow-md bg-white">
      <h2 className="text-3xl font-semibold mb-6 text-center">Register</h2>

      <input
        className="border p-3 w-full mb-4 rounded"
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={e => setFullName(e.target.value)}
      />

      <input
        className="border p-3 w-full mb-4 rounded"
        type="date"
        value={dob}
        onChange={e => setDob(e.target.value)}
      />

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
        className="bg-green-600 text-white py-2 px-4 w-full rounded hover:bg-green-700 transition"
        onClick={handleRegister}
      >
        Register
      </button>

      {errorMsg && <p className="text-red-600 mt-3 text-center">{errorMsg}</p>}
    </div>
  );
}
