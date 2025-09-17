// client/src/app/register/page.tsx

'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  // Form inputları için state'ler
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Backend'den gelen cevabı kullanıcıya göstermek için bir state
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Form gönderildiğinde çalışacak fonksiyon
  const handleSubmit = async (event: FormEvent) => {
    // Formun sayfayı yeniden yüklemesini engelle
    event.preventDefault();
    setMessage(''); // Önceki mesajları temizle
    setIsError(false);

    try {
      // Backend'deki /api/register endpoint'ine POST isteği gönder
      const response = await fetch('http://localhost:5000/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
        // Göndereceğimiz veriyi JSON formatına çeviriyoruz
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Eğer sunucudan 4xx veya 5xx gibi bir hata kodu dönerse
        setIsError(true);
        throw new Error(data.message || 'Bir hata oluştu.');
      }
      
      // Başarılı olursa
      setMessage(data.message);

    } catch (error: any) {
      // Bir hata yakalanırsa (network hatası veya yukarıdaki throw)
      setIsError(true);
      setMessage(error.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Hesap Oluştur</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
              E-posta Adresi
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Kayıt Ol
            </button>
          </div>
        </form>

        {/* Mesaj gösterme alanı */}
        {message && (
          <div className={`mt-4 text-center p-3 rounded-md ${isError ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            <p>{message}</p>
          </div>
        )}
        
        <div className="text-center">
            <Link href="/" className="font-medium text-blue-400 hover:text-blue-300">
              Ana Sayfaya Dön
            </Link>
        </div>

      </div>
    </main>
  );
}