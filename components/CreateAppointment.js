'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreateAppointment({ userId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    chief_complaint: '',
    booking_type: 'booked',
    booking_time: '',
    status: 'prebooked',
    room_status: 'waiting',
  });

  const handleSubmit = async () => {
    const { error } = await supabase.from('bookings').insert([{
      ...formData,
      patient_id: userId,
      created_at: new Date().toISOString()
    }]);

    if (!error) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      alert('Error creating appointment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-md shadow-md">
        <h2 className="text-xl font-bold mb-4">Create Appointment</h2>

        <div className="mb-3">
          <label className="block mb-1">Chief Complaint</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={formData.chief_complaint}
            onChange={e => setFormData({ ...formData, chief_complaint: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1">Booking Type</label>
          <select
            className="w-full border rounded p-2"
            value={formData.booking_type}
            onChange={e => setFormData({ ...formData, booking_type: e.target.value })}
          >
            <option value="booked">Booked</option>
            <option value="adhoc">Adhoc</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block mb-1">Booking Time</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={formData.booking_time}
            onChange={e => setFormData({ ...formData, booking_time: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1">Status</label>
          <select
            className="w-full border rounded p-2"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="prebooked">Prebooked</option>
            <option value="in_office">In Office</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block mb-1">Room Status</label>
          <select
            className="w-full border rounded p-2"
            value={formData.room_status}
            onChange={e => setFormData({ ...formData, room_status: e.target.value })}
          >
            <option value="waiting">Waiting</option>
            <option value="in_room">In Room</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
