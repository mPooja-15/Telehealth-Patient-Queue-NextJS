'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminQueuePage() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('prebooked');
  const [loading, setLoading] = useState(true);

  const fetchAllBookings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        provider_name,
        status,
        booking_time,
        patient:patient_id ( id, name, dob )
      `)
      .gte('booking_time', new Date().toISOString().slice(0, 10)) // today's bookings
      .order('booking_time', { ascending: true });

    if (error) {
      console.error('Error fetching all bookings:', error);
      setBookings([]);
    } else {
      setBookings(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const tabs = ['prebooked', 'in_office', 'completed'];

  const filteredBookings = bookings.filter(
    (b) => b.status === statusFilter
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Queue View</h1>

      <div className="flex space-x-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded border ${
              statusFilter === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            {tab.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredBookings.length === 0 ? (
        <p className="text-gray-500">No {statusFilter.replace('_', ' ')} bookings found.</p>
      ) : (
        <ul className="space-y-4">
          {filteredBookings.map((booking) => (
            <li key={booking.id} className="border p-4 rounded shadow-sm">
              <p><strong>Patient:</strong> {booking.patient?.name}</p>
              <p><strong>Provider:</strong> {booking.provider_name}</p>
              <p><strong>Status:</strong> {booking.status}</p>
              <p><strong>Time:</strong> {new Date(booking.booking_time).toLocaleTimeString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
