-- Create patients table
create table if not exists patients (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  dob date,
  email text,
  role text default 'patient' check (role in ('patient', 'provider', 'admin')),
  created_at timestamp with time zone default now()
);

-- Create bookings table
create table if not exists bookings (
  id bigint primary key generated always as identity,
  patient_id uuid references patients(id) on delete cascade,
  provider_name text,
  status text default 'prebooked' check (status in ('prebooked', 'in_office', 'completed')),
  patient_status text default 'Pending' check (patient_status in ('Pending', 'Confirmed', 'Intake', 'Ready for Provider', 'Provider', 'Ready for Discharge', 'Discharged')),
  booking_time timestamp with time zone not null,
  booking_type text default 'booked' check (booking_type in ('booked', 'adhoc')),
  room_status text default 'waiting' check (room_status in ('waiting', 'in_room', 'done')),
  chief_complaint text,
  completed_time timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_patient_status on bookings(patient_status);
create index if not exists idx_bookings_booking_time on bookings(booking_time);
create index if not exists idx_bookings_patient_id on bookings(patient_id);

-- Create the get_status_counts function
create or replace function get_status_counts()
returns table(status text, count bigint)
language sql
security definer
as $$
  select 
    status,
    count(*) as count
  from bookings 
  where booking_time >= current_date
  group by status
  order by status;
$$;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on patients to anon, authenticated;
grant all on bookings to anon, authenticated;
grant execute on function get_status_counts() to anon, authenticated; 