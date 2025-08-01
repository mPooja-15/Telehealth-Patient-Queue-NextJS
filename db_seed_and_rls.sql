-- Seed patients
insert into patients (id, name, dob, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'Alice Smith', '1980-01-01', 'alice@example.com', 'patient'),
  ('00000000-0000-0000-0000-000000000002', 'Bob Jones', '1975-05-10', 'bob@example.com', 'patient'),
  ('00000000-0000-0000-0000-000000000003', 'Carol Lee', '1990-09-15', 'carol@example.com', 'patient'),
  ('00000000-0000-0000-0000-000000000004', 'David Kim', '1985-12-20', 'david@example.com', 'patient'),
  ('00000000-0000-0000-0000-000000000005', 'Eve Miller', '2000-03-30', 'eve@example.com', 'patient');

-- Seed bookings
insert into bookings (id, provider_name, status, patient_status, booking_time, booking_type, room_status, patient_id, chief_complaint, completed_time) values
  (1, 'Dr. Adams', 'prebooked', 'Pending', now() + interval '1 hour', 'booked', 'waiting', '00000000-0000-0000-0000-000000000001', 'Headache', null),
  (2, 'Dr. Adams', 'prebooked', 'Confirmed', now() + interval '2 hour', 'booked', 'waiting', '00000000-0000-0000-0000-000000000002', 'Fever', null),
  (3, 'Dr. Brown', 'in_office', 'Intake', now() - interval '30 minute', 'adhoc', 'waiting', '00000000-0000-0000-0000-000000000003', 'Cough', null),
  (4, 'Dr. Brown', 'in_office', 'Ready for Provider', now() - interval '20 minute', 'booked', 'in_room', '00000000-0000-0000-0000-000000000004', 'Back pain', null),
  (5, 'Dr. Clark', 'in_office', 'Provider', now() - interval '10 minute', 'booked', 'in_room', '00000000-0000-0000-0000-000000000005', 'Sore throat', null),
  (6, 'Dr. Clark', 'completed', 'Discharged', now() - interval '2 hour', 'booked', 'done', '00000000-0000-0000-0000-000000000001', 'Checkup', now() - interval '1 hour 30 minute'),
  (7, 'Dr. Adams', 'completed', 'Discharged', now() - interval '3 hour', 'adhoc', 'done', '00000000-0000-0000-0000-000000000002', 'Follow-up', now() - interval '2 hour 30 minute'),
  (8, 'Dr. Brown', 'prebooked', 'Pending', now() + interval '3 hour', 'booked', 'waiting', '00000000-0000-0000-0000-000000000003', 'Allergy', null),
  (9, 'Dr. Clark', 'in_office', 'Ready for Discharge', now() - interval '40 minute', 'booked', 'in_room', '00000000-0000-0000-0000-000000000004', 'Sprain', null),
  (10, 'Dr. Adams', 'prebooked', 'Confirmed', now() + interval '4 hour', 'booked', 'waiting', '00000000-0000-0000-0000-000000000005', 'Consultation', null);

-- Enable RLS
alter table patients enable row level security;
alter table bookings enable row level security;

-- RLS: Only allow authenticated users to select/insert/update/delete their own patient record
create policy "Patients: Only self" on patients
  for all
  using (auth.uid() = id);

-- RLS: Providers/admins can see all bookings, patients can only see their own
create policy "Bookings: Providers see all, patients see own" on bookings
  for select
  using (
    exists (select 1 from patients p where p.id = auth.uid() and p.role in ('provider', 'admin'))
    or patient_id = auth.uid()
  );

-- RLS: Only providers/admins can insert/update/delete bookings
create policy "Bookings: Only providers/admins can modify" on bookings
  for all
  using (
    exists (select 1 from patients p where p.id = auth.uid() and p.role in ('provider', 'admin'))
  ); 