'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function BusinessDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dashboardMessage, setDashboardMessage] = useState('');

  useEffect(() => {
    // Yükleme bittiyse ve kullanıcı yoksa veya rolü 'business' değilse, ana sayfaya yönlendir
    if (!isLoading && (!user || user.role !== 'business')) {
      router.push('/'); // veya yetkisiz erişim sayfasına
      return;
    }

    const fetchDashboardData = async () => {
      if (user) { // Kullanıcı varsa fetch işlemini yap
        const token = localStorage.getItem('token');
        try {
          const response = await fetch('http://localhost:5000/api/business/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error('Panel verileri alınamadı.');
          }

          const data = await response.json();
          setDashboardMessage(data.message);
        } catch (error) {
          console.error(error);
          setDashboardMessage('Panel verileri yüklenirken bir hata oluştu.');
        }
      }
    };
    
    fetchDashboardData();

  }, [user, isLoading, router]);


  // Yükleme sırasında veya yönlendirme beklenirken bekleme ekranı
  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Yükleniyor...</p>
      </main>
    );
  }

  // Kullanıcı bilgisi varsa ve rolü 'business' ise paneli göster
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">İşletme Paneli</h1>
        <div className="p-4 bg-gray-700 rounded-md text-center">
            <p className="text-lg text-green-400">{dashboardMessage}</p>
        </div>
        {/* Buraya gelecekte işletmeye özel bileşenler eklenecek (Etkinlik Ekle butonu, Satış Raporları vb.) */}
      </div>
    </main>
  );
}