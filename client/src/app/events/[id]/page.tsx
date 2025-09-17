'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Veri yapılarını yeni alanları içerecek şekilde güncelleyelim
interface TicketType {
  id: string;
  name: string;
  price: string;
  capacity: number;
  service_fee: string;
  final_price: string;
}
interface EventDetails {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  category: string;
  organizer_email: string;
  ticket_types: TicketType[];
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, token } = useAuth();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [isPurchaseError, setIsPurchaseError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/events/${id}`);
        if (!response.ok) throw new Error('Etkinlik bilgileri yüklenemedi.');
        const data = await response.json();
        setEvent(data);
      } catch (err: any) { setError(err.message); } 
      finally { setLoading(false); }
    };
    fetchEventDetails();
  }, [id]);

  const handlePurchase = async (ticketTypeId: string) => {
    setPurchaseMessage('');
    setIsPurchaseError(false);
    if (!user) {
      router.push('/login?redirect=/events/' + id);
      return;
    }
    if (user.role !== 'end_user') {
      setIsPurchaseError(true);
      setPurchaseMessage('Sadece son kullanıcılar bilet alabilir.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ticket_type_id: ticketTypeId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Bilet oluşturulamadı.');
      setPurchaseMessage(data.message + ` Bilet ID: ${data.ticket.id}`);
    } catch (err: any) {
      setIsPurchaseError(true);
      setPurchaseMessage(err.message);
    }
  };

  if (loading) return <main className="text-center p-10">Yükleniyor...</main>;
  if (error) return <main className="text-center p-10 text-red-500">{error}</main>;
  if (!event) return <main className="text-center p-10">Etkinlik bulunamadı.</main>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
        <p className="text-lg text-gray-400 mb-4">{event.location}</p>
        <p className="text-xl text-blue-400 font-semibold mb-6">
            {new Date(event.event_date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-gray-300 whitespace-pre-wrap mb-8">{event.description}</p>
        
        <h2 className="text-2xl font-bold border-t border-gray-700 pt-6 mb-4">Biletler</h2>
        {purchaseMessage && (
          <div className={`mb-4 text-center p-3 rounded-md ${isPurchaseError ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            <p>{purchaseMessage}</p>
          </div>
        )}
        <div className="space-y-4">
            {event.ticket_types.map(ticket => (
                <div key={ticket.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-lg">{ticket.name}</p>
                        <p className="text-gray-400">Kapasite: {ticket.capacity}</p>
                    </div>
                    <div className="text-right">
                         <p className="font-bold text-xl text-green-400">
                           {parseFloat(ticket.final_price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                         </p>
                         <p className="text-xs text-gray-400">
                           (Bilet: {parseFloat(ticket.price).toFixed(2)} TL + Hizmet B.: {parseFloat(ticket.service_fee).toFixed(2)} TL)
                         </p>
                         <button 
                            onClick={() => handlePurchase(ticket.id)}
                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Satın Al
                         </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}