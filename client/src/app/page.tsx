'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; 

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  category: string;
  organizer_email: string;
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');
        if (!response.ok) throw new Error('Etkinlikler yüklenemedi.');
        const data = await response.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <p className="text-center mt-10">Etkinlikler Yükleniyor...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10">Yaklaşan Etkinlikler</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.length > 0 ? (
          events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full flex flex-col transform hover:scale-105 transition-transform duration-300 cursor-pointer">
                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-sm text-blue-400 font-semibold">{new Date(event.event_date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <h2 className="text-2xl font-bold mt-2 mb-2">{event.name}</h2>
                  <p className="text-gray-400 mb-4">{event.location}</p>
                  <p className="text-gray-300 mb-4 line-clamp-3 flex-grow">{event.description}</p>
                  <div className="text-right mt-auto">
                    {/* --- DEĞİŞİKLİK BURADA --- */}
                    {/* <a> etiketini <span> ile değiştirdik */}
                    <span className="font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg">
                      Bilet Al
                    </span>
                    {/* --- DEĞİŞİKLİK SONU --- */}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p>Gösterilecek planlanmış bir etkinlik bulunmuyor.</p>
        )}
      </div>
    </div>
  );
}