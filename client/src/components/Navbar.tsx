'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Eventix
        </Link>
        <div className="space-x-4">
          {isLoading ? (
            <span>Yükleniyor...</span>
          ) : user ? (
            <>
              {/* Eğer kullanıcı admin ise, Admin Paneli linkini göster */}
              {user.role === 'admin' && (
                <Link href="/admin" className="hover:text-blue-400">
                  Admin Paneli
                </Link>
              )}
              {/* YENİ: Eğer kullanıcı business ise, İşletme Paneli linkini göster */}
              {user.role === 'business' && (
                <Link href="/dashboard" className="hover:text-blue-400">
                  İşletme Paneli
                </Link>
              )}
              <Link href="/profile" className="hover:text-blue-400">
                Profil
              </Link>
              <button onClick={logout} className="hover:text-red-400">
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-400">
                Giriş Yap
              </Link>
              <Link href="/register" className="hover:text-blue-400">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}