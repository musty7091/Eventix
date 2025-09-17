'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // ...
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      
      // Merkezi login fonksiyonumuzu çağırıyoruz
      login(data.token);
      setMessage(data.message);
      // Başarılı girişten sonra kullanıcıyı profil sayfasına yönlendir
      router.push('/profile');

    } catch (error: any) {
      setIsError(true);
      setMessage(error.message);
    }
  };

  return (
    // ... Bu dosyanın return kısmı (JSX) aynı kalabilir ...
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Giriş Yap</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email">E-posta Adresi</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                   className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
          </div>
          <div>
            <label htmlFor="password">Şifre</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                   className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
          </div>
          <div>
            <button type="submit"
                    className="w-full flex justify-center py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Giriş Yap
            </button>
          </div>
        </form>
        {message && (
          <div className={`mt-4 text-center p-3 rounded-md ${isError ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            <p>{message}</p>
          </div>
        )}
        <div className="text-center">
            <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300">
              Hesabın yok mu? Kayıt Ol
            </Link>
        </div>
      </div>
    </main>
  );
}