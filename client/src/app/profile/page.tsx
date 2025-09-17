'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Yükleme bittiyse ve kullanıcı yoksa login'e yönlendir
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);


  // Veri yüklenirken veya kullanıcı yoksa (yönlendirme beklenirken)
  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Yükleniyor...</p>
      </main>
    );
  }

  // Kullanıcı bilgisi varsa göster
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-lg p-8 space-y-4 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Profil Sayfası</h1>
        <div className="space-y-3 text-lg">
          <p><span className="font-semibold text-gray-400">Kullanıcı ID:</span> <span className="font-mono text-blue-400">{user.id}</span></p>
          <p><span className="font-semibold text-gray-400">E-posta:</span> <span className="font-mono text-blue-400">{user.email}</span></p>
          <p><span className="font-semibold text-gray-400">Kullanıcı Rolü:</span> <span className="font-mono text-green-400 uppercase">{user.role}</span></p>
        </div>
      </div>
    </main>
  );
}