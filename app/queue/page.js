'use client';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreateAppointment from "@/components/CreateAppointment";

export default function QueuePage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("prebooked");
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [counts, setCounts] = useState({});
  const [providerFilter, setProviderFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [patientStatusFilter, setPatientStatusFilter] = useState("");

  // Patient status configuration
  const patientStatusOptions = [
    "Pending",
    "Confirmed",
    "Intake",
    "Ready for provider",
    "Provider",
    "Ready for Discharge",
    "Discharged"
  ];

  const patientStatusColors = {
    Pending: "bg-gray-100 text-gray-800",
    Confirmed: "bg-blue-100 text-blue-800",
    Intake: "bg-purple-100 text-purple-800",
    "Ready for provider": "bg-yellow-100 text-yellow-800",
    Provider: "bg-indigo-100 text-indigo-800",
    "Ready for Discharge": "bg-amber-100 text-amber-800",
    Discharged: "bg-green-100 text-green-800",
  };

  const fetchUserRole = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    setUserId(user.id);
    const { data: patientData } = await supabase
      .from("patients")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(patientData?.role || "patient");
  };

  const fetchStatusCounts = async () => {
    const { data, error } = await supabase.rpc("get_status_counts");
    if (!error && data) {
      const countsMap = {};
      data.forEach((item) => {
        countsMap[item.status] = item.count;
      });
      setCounts(countsMap);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    if (!userId || !role) {
      setBookings([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("bookings")
      .select(
        `
        id, provider_name, status, patient_status, booking_time, booking_type, room_status, patient_id,
        patient:patient_id(name, dob)
      `
      )
      .gte("booking_time", new Date().toISOString().slice(0, 10));

    if (role === "patient") {
      query = query.eq("patient_id", userId);
    } else {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query.order("booking_time", {
      ascending: true,
    });

    if (!error) {
      let filtered = data || [];
      if (providerFilter.trim()) {
        filtered = filtered.filter((b) =>
          b.provider_name
            ?.toLowerCase()
            .includes(providerFilter.trim().toLowerCase())
        );
      }
      if (patientFilter.trim()) {
        filtered = filtered.filter((b) =>
          b.patient?.name
            ?.toLowerCase()
            .includes(patientFilter.trim().toLowerCase())
        );
      }
      if (patientStatusFilter) {
        filtered = filtered.filter((b) =>
          b.patient_status === patientStatusFilter
        );
      }
      setBookings(filtered);
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (role) {
      fetchStatusCounts();
      fetchBookings();
    }
  }, [statusFilter, role, userId]);

  useEffect(() => {
    fetchBookings();
  }, [providerFilter, patientFilter, patientStatusFilter]);

  const updateBookingStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error) {
      fetchBookings();
      fetchStatusCounts();
    }
  };

  const updatePatientStatus = async (id, newPatientStatus) => {
    const { error } = await supabase
      .from("bookings")
      .update({ patient_status: newPatientStatus })
      .eq("id", id);
    if (!error) {
      fetchBookings();
    }
  };

  const renderTabs = () => {
    const tabs = ["prebooked", "in_office", "completed"];
    return (
      <div className="flex space-x-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.replace("_", " ").toUpperCase()} ({counts[tab] || 0})
          </button>
        ))}
      </div>
    );
  };

  const renderBookingCard = (booking) => (
    <div
      key={booking.id}
      className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow mb-4"
    >
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-sm text-gray-500">Patient</p>
          <p className="font-medium">{booking.patient?.name || "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">DOB</p>
          <p>
            {booking.patient?.dob
              ? new Date(booking.patient.dob).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Provider</p>
          <p className="font-medium">{booking.provider_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Type</p>
          <p>
            {booking.booking_type === "adhoc"
              ? "Adhoc"
              : `Booked ${new Date(booking.booking_time).toLocaleTimeString(
                  [],
                  { hour: "2-digit", minute: "2-digit" }
                )}`}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3">
        <div>
          {booking.patient_status && (
            <div className="mb-3">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  patientStatusColors[booking.patient_status] ||
                  "bg-gray-100 text-gray-800"
                }`}
              >
                {booking.patient_status}
              </span>
            </div>
          )}
        </div>
        {role !== "patient" && booking.status !== "completed" && (
          <button
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
            onClick={() =>
              updateBookingStatus(
                booking.id,
                booking.status === "prebooked" ? "in_office" : "completed"
              )
            }
          >
            Move to {booking.status === "prebooked" ? "In Office" : "Completed"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto mt-8 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Today's Queue</h1>
          <p className="text-gray-500">
            Manage patient appointments and status
          </p>
        </div>
        {role === "patient" && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Create Appointment</span>
          </button>
        )}
      </div>

      {role !== "patient" && (
        <>
          {renderTabs()}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Filter by Provider"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Filter by Patient Name"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={patientStatusFilter}
                onChange={(e) => setPatientStatusFilter(e.target.value)}
              >
                <option value="">All Patient Statuses</option>
                {patientStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map(renderBookingCard)
          ) : (
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No bookings found
              </h3>
              <p className="mt-1 text-gray-500">
                There are currently no appointments in this category.
              </p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CreateAppointment
          userId={userId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchBookings();
            fetchStatusCounts();
          }}
        />
      )}
    </div>
  );
}