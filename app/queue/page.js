"use client";
import { useEffect, useState, useRef } from "react";
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
  const [patientStatusFilter, setPatientStatusFilter] = useState([]); // Changed to array for multi-select
  const [groupStates, setGroupStates] = useState({
    waiting_room: true,
    in_call: true,
  });
  const [contextMenuOpen, setContextMenuOpen] = useState(null);
  const [viewPatientModal, setViewPatientModal] = useState(null);
  const contextMenuRef = useRef();

  // Patient status configuration
  const patientStatusOptions = [
    "Pending",
    "Confirmed",
    "Intake",
    "Ready for provider",
    "Provider",
    "Ready for Discharge",
    "Discharged",
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

  // Helper to calculate waiting time
  const getWaitingTime = (booking) => {
    if (!booking.booking_time) return null;
    const now = new Date();
    const bookingTime = new Date(booking.booking_time);
    if (booking.status === 'completed') return null;
    const diffMs = now - bookingTime;
    if (diffMs < 0) return null;
    const diffMin = Math.floor(diffMs / 60000);
    return `${diffMin} min`;
  };

  // Helper to calculate total wait time (for completed)
  const getTotalWaitTime = (booking) => {
    if (!booking.booking_time || !booking.completed_time) return null;
    const bookingTime = new Date(booking.booking_time);
    const completedTime = new Date(booking.completed_time);
    const diffMs = completedTime - bookingTime;
    if (diffMs < 0) return null;
    const diffMin = Math.floor(diffMs / 60000);
    return `${diffMin} min`;
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = '/login';
    }
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
        id, provider_name, status, patient_status, booking_time, booking_type, room_status, patient_id, chief_complaint, completed_time,
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
      // Multi-status filtering
      if (patientStatusFilter.length > 0 && patientStatusFilter.length < patientStatusOptions.length) {
        filtered = filtered.filter((b) => patientStatusFilter.includes(b.patient_status));
      }
      setBookings(filtered);
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  // Close context menu on click outside
  useEffect(() => {
    function handleClick(e) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenuOpen(null);
      }
    }
    if (contextMenuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [contextMenuOpen]);

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

  const toggleGroup = (groupName) => {
    setGroupStates((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const groupBookingsByRoomStatus = () => {
    const groups = {
      waiting_room: {
        name: "Waiting Room",
        bookings: [],
        count: 0,
      },
      in_call: {
        name: "In Call",
        bookings: [],
        count: 0,
      },
    };

    bookings.forEach((booking) => {
      if (booking.room_status === "waiting") { // Fixed mapping
        groups.waiting_room.bookings.push(booking);
        groups.waiting_room.count++;
      } else if (booking.room_status === "in_room") { // Fixed mapping
        groups.in_call.bookings.push(booking);
        groups.in_call.count++;
      }
    });

    return groups;
  };

  const shouldShowJoinCall = (patientStatus) => {
    return ["Ready for provider", "Provider"].includes(patientStatus);
  };

  const shouldShowIntake = (patientStatus) => {
    return ["Pending", "Confirmed", "Intake"].includes(patientStatus);
  };

  // Count patients per status for current tab
  const statusCounts = patientStatusOptions.reduce((acc, status) => {
    acc[status] = bookings.filter(b => b.patient_status === status).length;
    return acc;
  }, {});

  const handleStatusFilterChange = (status) => {
    setPatientStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const renderGroup = (groupName, group) => {
    if (group.count === 0) return null;

    return (
      <div key={groupName} className="mb-6">
        <div
          className="flex justify-between items-center bg-gray-50 p-3 rounded-t-lg border border-gray-200 cursor-pointer"
          onClick={() => toggleGroup(groupName)}
        >
          <div className="flex items-center">
            <h3 className="font-medium text-gray-800">{group.name}</h3>
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                groupName === "waiting_room"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {group.count}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform ${
              groupStates[groupName] ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {groupStates[groupName] && (
          <div className="space-y-3 p-3 border-l border-r border-b border-gray-200 rounded-b-lg">
            {group.bookings.map((booking) => renderBookingCard(booking))}
          </div>
        )}
      </div>
    );
  };

  const renderBookingCard = (booking) => (
    <div
      key={booking.id}
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow relative"
    >
      {/* 3-dot context menu */}
      <div className="absolute top-2 right-2">
        <button
          className="p-1 rounded-full hover:bg-gray-200"
          onClick={() => setContextMenuOpen(contextMenuOpen === booking.id ? null : booking.id)}
          aria-label="Open context menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
        {contextMenuOpen === booking.id && (
          <div ref={contextMenuRef} className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-20">
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => { setViewPatientModal(booking); setContextMenuOpen(null); }}
            >
              View Patient
            </button>
            {shouldShowIntake(booking.patient_status) && (
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => { console.log("Intake action"); setContextMenuOpen(null); }}
              >
                Intake
              </button>
            )}
          </div>
        )}
      </div>

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
        <div>
          <p className="text-sm text-gray-500">Chief Complaint</p>
          <p>{booking.chief_complaint || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Waiting Time</p>
          <p>{getWaitingTime(booking) || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Wait Time</p>
          <p>{getTotalWaitTime(booking) || 'N/A'}</p>
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
        <div className="flex items-center gap-2">
          {shouldShowJoinCall(booking.patient_status) && (
            <button
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors"
              onClick={() => console.log("Join call clicked")}
            >
              Join Call
            </button>
          )}
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
    </div>
  );

  // Patient details modal
  const renderPatientModal = () => {
    if (!viewPatientModal) return null;
    const b = viewPatientModal;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setViewPatientModal(null)}>&times;</button>
          <h2 className="text-xl font-bold mb-4">Patient Details</h2>
          <div className="mb-2"><b>Name:</b> {b.patient?.name}</div>
          <div className="mb-2"><b>DOB:</b> {b.patient?.dob ? new Date(b.patient.dob).toLocaleDateString() : 'N/A'}</div>
          <div className="mb-2"><b>Provider:</b> {b.provider_name}</div>
          <div className="mb-2"><b>Status:</b> {b.patient_status}</div>
          <div className="mb-2"><b>Type:</b> {b.booking_type}</div>
          <div className="mb-2"><b>Booking Time:</b> {b.booking_time ? new Date(b.booking_time).toLocaleString() : 'N/A'}</div>
          <div className="mb-2"><b>Room Status:</b> {b.room_status}</div>
          <div className="mb-2"><b>Chief Complaint:</b> {b.chief_complaint || 'N/A'}</div>
          <div className="mb-2"><b>Waiting Time:</b> {getWaitingTime(b) || 'N/A'}</div>
          <div className="mb-2"><b>Total Wait Time:</b> {getTotalWaitTime(b) || 'N/A'}</div>
        </div>
      </div>
    );
  };

  const renderTabs = () => {
    const tabs = [
      {
        id: "prebooked",
        name: "Prebooked",
        color: "bg-blue-100 text-blue-800",
      },
      {
        id: "in_office",
        name: "In Office",
        color: "bg-green-100 text-green-800",
      },
      {
        id: "completed",
        name: "Completed",
        color: "bg-purple-100 text-purple-800",
      },
    ];

    return (
      <div className="flex space-x-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${
              statusFilter === tab.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{tab.name}</span>
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                statusFilter === tab.id ? "bg-white text-blue-600" : tab.color
              }`}
            >
              {counts[tab.id] || 0}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (bookings.length === 0) {
      return (
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
      );
    }

    if (statusFilter === "in_office") {
      const groups = groupBookingsByRoomStatus();
      return (
        <div>
          {renderGroup("waiting_room", groups.waiting_room)}
          {renderGroup("in_call", groups.in_call)}
        </div>
      );
    }

    return <div className="space-y-4">{bookings.map(renderBookingCard)}</div>;
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Today's Queue</h1>
          <p className="text-gray-500">
            Manage patient appointments and status
          </p>
        </div>
        <div className="flex items-center space-x-4">
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
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
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
              <div className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg bg-white shadow-sm">
                <div className="font-medium mb-1">Patient Status</div>
                <div className="max-h-48 overflow-y-auto">
                  {patientStatusOptions.map((status) => (
                    <label key={status} className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={patientStatusFilter.includes(status)}
                        onChange={() => handleStatusFilterChange(status)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <span>{status} <span className="ml-1 text-xs text-gray-500">({statusCounts[status]})</span></span>
                    </label>
                  ))}
                </div>
                <button
                  className="mt-2 text-xs text-blue-600 underline"
                  onClick={() => setPatientStatusFilter([])}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {renderContent()}

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
      {renderPatientModal()}
    </div>
  );
}