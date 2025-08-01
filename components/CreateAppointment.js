'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreateAppointment({ userId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    chief_complaint: '',
    booking_time: '',
    status: 'prebooked',
    room_status: 'waiting_room',
    provider_name: '',
    booking_type: 'booked' // Set default value here
  });
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch unique provider names from bookings table
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('provider_name')
          .not('provider_name', 'is', null)
          .order('provider_name', { ascending: true });

        if (error) throw error;
        
        // Get unique provider names
        const uniqueDoctors = [...new Set(data.map(item => item.provider_name))];
        setDoctors(uniqueDoctors);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    };

    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.from('bookings').insert([{
        ...formData,
        patient_id: userId,
        created_at: new Date().toISOString(),
        booking_type: 'booked' // Always set to 'booked'
      }]);

      if (error) throw error;

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating appointment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Appointment</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
              <select
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={formData.provider_name}
                onChange={e => setFormData({ ...formData, provider_name: e.target.value })}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor, index) => (
                  <option key={index} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={formData.chief_complaint}
                onChange={e => setFormData({ ...formData, chief_complaint: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking Time</label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={formData.booking_time}
                onChange={e => setFormData({ ...formData, booking_time: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="prebooked">Prebooked</option>
                <option value="in_office">In Office</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Status</label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={formData.room_status}
                onChange={e => setFormData({ ...formData, room_status: e.target.value })}
              >
                <option value="waiting_room">Waiting Room</option>
                <option value="in_call">In Call</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2.5 rounded-lg text-white font-medium ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition`}
              >
                {isLoading ? 'Creating...' : 'Create Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}