// client/src/app/page.tsx

// 'use client' direktifi, bu component'in tarayıcıda çalışacağını belirtir.
// Bu, useState gibi hook'ları ve buton tıklaması gibi olayları kullanmamız için gereklidir.
'use client';

// React'ten useState hook'unu import ediyoruz. Bu, component içinde veri saklamamızı sağlar.
import { useState } from 'react';

export default function Home() {
  // Backend'den gelecek mesajı saklamak için bir state değişkeni oluşturuyoruz.
  // Başlangıç değeri boş bir string.
  const [message, setMessage] = useState('');

  // Butona tıklandığında çalışacak olan asenkron fonksiyon.
  const fetchMessageFromBackend = async () => {
    try {
      // Backend'imizin /api endpoint'ine bir GET isteği gönderiyoruz.
      const response = await fetch('http://localhost:5000/api');
      
      // Gelen cevabı JSON formatında parse ediyoruz.
      const data = await response.json();
      
      // Gelen verideki 'message' alanını alıp state'imizi güncelliyoruz.
      setMessage(data.message);

    } catch (error) {
      // Bir hata olursa, hatayı konsola yazdırıp kullanıcıya bir hata mesajı gösteriyoruz.
      console.error('Backend\'den veri alınırken bir hata oluştu:', error);
      setMessage('Sunucuya bağlanılamadı. Lütfen backend sunucusunun çalıştığından emin olun.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Eventix Projesine Hoş Geldiniz</h1>
        
        <button
          onClick={fetchMessageFromBackend}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Backend'den Mesaj Getir
        </button>

        {/* message state'i boş değilse, mesajı bir kutu içinde göster */}
        {message && (
          <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Sunucudan Gelen Mesaj:</p>
            <p className="mt-2 text-green-400 font-mono">{message}</p>
          </div>
        )}
      </div>
    </main>
  );
}