'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // YENİ: Sadece şifre eşleşme durumunu kontrol etmek için ayrı bir state
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // GÜNCELLENDİ: Şifreler her değiştiğinde anında kontrol eden useEffect
  useEffect(() => {
    // Sadece şifre tekrarı alanına bir şeyler yazıldıysa kontrolü başlat
    if (confirmPassword) {
      if (password === confirmPassword) {
        setPasswordsMatch(true); // Eşleşiyor
      } else {
        setPasswordsMatch(false); // Eşleşmiyor
      }
    } else {
      setPasswordsMatch(null); // Şifre tekrarı boşsa durumu sıfırla
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    // Gönderim anında son bir kez daha kontrol edelim.
    if (password !== confirmPassword) {
      setIsError(true);
      setMessage('Şifreler eşleşmiyor.');
      return;
    }
    
    // Diğer kontroller (Bunlar aynı kalıyor)
    const phoneRegex = /^\+90\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        setIsError(true);
        setMessage('Telefon numarası formatı geçersiz. Lütfen +90 ile başlayarak 10 haneli numaranızı girin.');
        return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        setIsError(true);
        setMessage('Şifre en az 8 karakter olmalı, büyük/küçük harf ve rakam içermelidir.');
        return;
    }

    setIsLoading(true);
    setMessage('');
    setIsError(false);
    
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, password,
            first_name: firstName, last_name: lastName,
            phone_number: phoneNumber, date_of_birth: dateOfBirth
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Bir hata oluştu.');
      }
      setMessage(data.message);
    } catch (error: any) {
      setIsError(true);
      setMessage(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Hesap Oluştur</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* İsim, Soyisim, E-posta alanları aynı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="firstName">İsim</label><input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/></div>
                <div><label htmlFor="lastName">Soyisim</label><input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/></div>
            </div>
            <div><label htmlFor="email">E-posta Adresi</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/></div>
            
            {/* Şifre Alanları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="password">Şifre</label>
                    <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
                </div>
                <div>
                    <label htmlFor="confirmPassword">Şifre Tekrar</label>
                    {/* YENİ: Anlık geri bildirim için inputun yanına bir alan ekliyoruz */}
                    <div className="relative">
                        <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
                        {/* Eşleşme durumuna göre tik veya hata göster */}
                        {passwordsMatch === true && (
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-500 text-xl">✓</span>
                        )}
                    </div>
                </div>
            </div>
            {/* YENİ: Şifre eşleşme hatasını doğrudan burada gösteriyoruz */}
            {passwordsMatch === false && (
                <p className="text-xs text-red-400">Şifreler eşleşmiyor.</p>
            )}
            <p className="text-xs text-gray-400">Şifre en az 8 karakter olmalı, büyük/küçük harf ve rakam içermelidir.</p>
            
            {/* Telefon ve Doğum Tarihi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="phoneNumber">Telefon Numarası</label>
                    <input id="phoneNumber" type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+905..." maxLength={13} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
                </div>
                <div>
                    <label htmlFor="dateOfBirth">Doğum Tarihi</label>
                    <input id="dateOfBirth" type="date" required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
                </div>
            </div>

            <div><button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-500">{isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'}</button></div>
        </form>

        {/* Genel form mesajları alanı (sunucudan gelen cevaplar için) */}
        {message && message !== 'Şifreler eşleşmiyor.' && (
          <div className={`mt-4 text-center p-3 rounded-md ${isError ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            <p>{message}</p>
          </div>
        )}
        
        <div className="text-center"><Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">Zaten bir hesabın var mı? Giriş Yap</Link></div>
      </div>
    </main>
  );
}