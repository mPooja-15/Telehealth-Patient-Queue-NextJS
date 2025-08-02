# Telehealth Patient Queue Management System

A comprehensive full-stack application built with **Next.js (App Router)** and **Supabase** for managing telehealth patient workflows, provider queues, and real-time updates.

---

## 📋 PRD Implementation Status

This application fully implements the **Telehealth Patient Queue PRD** with all required features:

### ✅ **Complete Features**

#### **3.1 Queue Categories and Tabs**
- Three primary tabs: **Pre-booked**, **In Office**, **Completed**
- Tab counts displayed for each category
- Single-click tab switching
- Only one tab active at a time

#### **3.2 Advanced Filtering**
- **Multi-status selection** with checkboxes
- **Patient count per status** shown in brackets
- Provider name filtering
- Patient name fuzzy search
- Immediate filter application
- Clear All functionality

#### **3.3 Patient Grouping**
- **Waiting Room** (patients ready for call)
- **In Call** (patients in active telehealth sessions)
- Group names, counts, and collapsible toggles
- Visual distinction between groups
- Empty groups automatically hidden

#### **3.4 Patient Information Display**
- Type and status with color-coded indicators
- "Adhoc" or "Booked hh:mm" display
- **Waiting time** (current and total where applicable)
- Patient name and DOB
- Provider assigned
- Chief complaint/reason for visit
- Color-coded status indicators for all workflow stages

#### **3.5 Action Buttons and Context Menu**
- **Join Call** button for READY/READY FOR PROVIDER status
- **3-dot context menu** for each patient
- **View Patient** modal with complete details
- **Intake** action for eligible statuses (Pending, Confirmed, Intake)

#### **Additional Features**
- **Real-time updates** using Supabase subscriptions
- **Role-based access** (patients vs providers)
- **Admin panel** for status management
- **Authentication** with Supabase Auth
- **Row Level Security** (RLS) policies

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ 
- Supabase account
- Git

### 2. Clone and Install
```bash
git clone https://github.com/yourusername/telehealth-patient-queue.git
cd telehealth-patient-queue
npm install
```

### 3. Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run `database_schema.sql` to create tables and functions
4. Run `db_seed_and_rls.sql` to enable RLS and seed sample data

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 📁 Project Structure

```
├── app/
│   ├── admin/queue/          # Admin panel for status management
│   ├── auth/                 # Authentication callbacks
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── queue/                # Main queue dashboard
│   └── layout.tsx            # Root layout
├── components/
│   └── CreateAppointment.js  # Appointment creation modal
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── database_schema.sql       # Database schema and functions
├── db_seed_and_rls.sql      # Sample data and RLS policies
└── SETUP.md                 # Detailed setup guide
```

---

## 🔧 Features in Detail

### **Authentication & Authorization**
- Supabase Auth integration
- Role-based views (patient vs provider)
- RLS policies for data security
- Session management

### **Queue Management**
- Real-time status updates
- Multi-tab organization
- Advanced filtering capabilities
- Patient grouping by room status

### **Admin Panel**
- Move bookings between tabs
- Change room status (waiting, in_room, done)
- Update patient status through workflow
- Real-time synchronization

### **Patient Experience**
- Registration and login
- Create appointments
- View own bookings
- Real-time status updates

---

## 🧪 Testing

### Test User Flows

1. **Patient Registration/Login**
   - Visit `/register` to create account
   - Visit `/login` to sign in
   - Patients see only their own bookings

2. **Provider Access**
   - Create provider account (set role='provider' in Supabase)
   - Access full queue management features
   - Use admin panel for status changes

3. **Queue Features**
   - Switch between tabs (Pre-booked, In Office, Completed)
   - Use multi-status filtering with counts
   - Test patient grouping in In Office tab
   - Verify real-time updates
   - Test context menu and modals

4. **Admin Panel**
   - Visit `/admin/queue`
   - Move bookings between tabs
   - Change room and patient status

---

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control**
- **Authenticated users only** can access data
- **Patients see only their own bookings**
- **Providers see all bookings and can modify**

---

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Database Schema
- `patients` table with role-based access
- `bookings` table with workflow status tracking
- `get_status_counts()` function for tab counts
- Real-time subscriptions enabled

---

## 📊 Sample Data

The system includes sample data:
- **5 patients** with different roles
- **10 bookings** across all statuses
- **Various providers** and appointment types
- **Realistic workflow scenarios**

---

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### Other Platforms
- Netlify
- Railway
- DigitalOcean App Platform

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues or questions:
1. Check the `README.md` file for detailed instructions
2. Review the troubleshooting section
3. Open an issue on GitHub

---

**Built with ❤️ using Next.js and Supabase**
