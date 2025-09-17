'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Veritabanından gelecek her bir kullanıcının yapısını tanımlıyoruz
interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // Kullanıcı listesini saklamak için bir state
  const [users, setUsers] = useState<UserData[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Yükleme bittiyse ve kullanıcı admin değilse, ana sayfaya yönlendir
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      if (user && user.role === 'admin') {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch('http://localhost:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error('Kullanıcı listesi alınamadı.');
          }

          const data: UserData[] = await response.json();
          setUsers(data);
        } catch (err: any) {
          setError(err.message);
        }
      }
    };

    // isLoading bittiğinde ve kullanıcı admin ise veriyi çek
    if (!isLoading) {
        fetchUsers();
    }

  }, [user, isLoading, router]);

  // Yükleme sırasında veya yönlendirme beklenirken bekleme ekranı
  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Yükleniyor...</p>
      </main>
    );
  }

  // Admin paneli
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900 text-white">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Admin Paneli - Kullanıcı Yönetimi</h1>
        {error && <p className="text-red-500 bg-red-900 p-3 rounded-md">{error}</p>}
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-700 text-left text-gray-300 uppercase text-sm">
                <th className="px-5 py-3">E-posta</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="px-5 py-4">
                    <p className="text-white whitespace-no-wrap">{u.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full
                      ${u.role === 'admin' ? 'text-red-900 bg-red-200' : ''}
                      ${u.role === 'business' ? 'text-blue-900 bg-blue-200' : ''}
                      ${u.role === 'end_user' ? 'text-green-900 bg-green-200' : ''}
                    `}>
                      <span aria-hidden className="absolute inset-0 opacity-50 rounded-full"></span>
                      <span className="relative">{u.role}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-300 whitespace-no-wrap">
                      {new Date(u.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}