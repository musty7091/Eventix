'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TicketType {
  name: string;
  price: string;
  capacity: string;
}

export default function CreateEventForm() {
  const { token } = useAuth();
  
  // Etkinliğin ana bilgileri için state'ler
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [event_date, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('concert');
  
  // Dinamik bilet türleri için state (bir dizi olarak tutulur)
  const [ticket_types, setTicketTypes] = useState<TicketType[]>([
    { name: '', price: '', capacity: '' }
  ]);
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Bilet türü inputları değiştiğinde çalışır
  const handleTicketTypeChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const values = [...ticket_types];
    values[index][event.target.name as keyof TicketType] = event.target.value;
    setTicketTypes(values);
  };

  // Yeni bir bilet türü alanı ekler
  const addTicketType = () => {
    setTicketTypes([...ticket_types, { name: '', price: '', capacity: '' }]);
  };

  // Bir bilet türü alanını siler
  const removeTicketType = (index: number) => {
    const values = [...ticket_types];
    values.splice(index, 1);
    setTicketTypes(values);
  };

  // Form gönderildiğinde çalışır
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setIsError(false);

    const eventData = {
      name,
      description,
      event_date,
      location,
      category,
      // Fiyat ve kapasiteyi sayıya çevirerek gönderiyoruz
      ticket_types: ticket_types.map(t => ({
        ...t,
        price: parseFloat(t.price),
        capacity: parseInt(t.capacity, 10),
      })),
    };

    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Etkinlik oluşturulamadı.');
      }
      setMessage(data.message);

    } catch (error: any) {
      setIsError(true);
      setMessage(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Etkinlik Adı */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-400">Etkinlik Adı</label>
        <input type="text" name="name" id="name" required value={name} onChange={(e) => setName(e.target.value)}
               className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" />
      </div>
      
      {/* Açıklama */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-400">Açıklama</label>
        <textarea name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" />
      </div>

      {/* Tarih ve Mekan (yan yana) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-400">Etkinlik Tarihi</label>
          <input type="datetime-local" name="event_date" id="event_date" required value={event_date} onChange={(e) => setEventDate(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-400">Mekan</label>
          <input type="text" name="location" id="location" value={location} onChange={(e) => setLocation(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" />
        </div>
      </div>

      {/* Kategori */}
      <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-400">Kategori</label>
          <select name="category" id="category" value={category} onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
              <option value="concert">Konser</option>
              <option value="theater">Tiyatro</option>
              <option value="festival">Festival</option>
              <option value="sports">Spor</option>
              <option value="other">Diğer</option>
          </select>
      </div>

      {/* Bilet Türleri */}
      <hr className="border-gray-600" />
      <h3 className="text-xl font-semibold">Bilet Türleri</h3>
      {ticket_types.map((ticket, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end p-4 border border-gray-700 rounded-lg">
          <div className="md:col-span-3">
            <label className="text-sm">Tür Adı (örn: VIP)</label>
            <input type="text" name="name" required value={ticket.name} onChange={e => handleTicketTypeChange(index, e)}
                   className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm">Fiyat (₺)</label>
            <input type="number" name="price" required value={ticket.price} onChange={e => handleTicketTypeChange(index, e)}
                   className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm">Kapasite</label>
            <input type="number" name="capacity" required value={ticket.capacity} onChange={e => handleTicketTypeChange(index, e)}
                   className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md" />
          </div>
          <div className="md:col-span-2">
            <button type="button" onClick={() => removeTicketType(index)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Sil
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addTicketType}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
        Yeni Bilet Türü Ekle
      </button>
      <hr className="border-gray-600" />

      {/* Ana Gönder Butonu */}
      <button type="submit"
              className="w-full flex justify-center py-3 px-4 border rounded-md text-white bg-green-600 hover:bg-green-700 text-lg font-semibold">
        Etkinliği Oluştur
      </button>

      {/* Mesaj Alanı */}
      {message && (
          <div className={`mt-4 text-center p-3 rounded-md ${isError ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            <p>{message}</p>
          </div>
        )}
    </form>
  );
}