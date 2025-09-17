'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import CreateEventForm from '@/components/CreateEventForm'; // Formumuzu import ediyoruz

export default function BusinessDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'business')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900 text-white">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">İşletme Paneli</h1>
        <p className="text-center text-gray-400">Hoş geldin, {user.email}. Buradan yeni etkinlikler oluşturabilirsin.</p>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Yeni Etkinlik Oluştur</h2>
          <CreateEventForm /> {/* Form component'imizi burada çağırıyoruz */}
        </div>
      </div>
    </main>
  );
}