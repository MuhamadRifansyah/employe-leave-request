# Leavely — Employee Leave Management Platform

> Modern, premium employee leave management system with role-based access control, glassmorphism UI, and full audit logging.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Demo Credentials](#-demo-credentials)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Role-Based Access Control](#-role-based-access-control)
- [Pages & Routes](#-pages--routes)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)

---

## 🔭 Overview

**Leavely** is a full-featured employee leave management platform built with Next.js 16 and React 19. It provides a complete workflow for managing employee leave requests — from submission to approval/rejection — with role-based access control for 3 different user roles.

Key highlights:
- 🎨 **Glassmorphism UI** with gradient mesh backgrounds and dark/light themes
- 🔐 **3-tier RBAC** (Admin, Manager, Employee) with middleware-enforced route protection
- 📊 **Analytics Dashboard** with interactive charts and exportable reports
- 📝 **Full Audit Trail** with activity logging for all actions
- 📱 **Responsive Design** with collapsible sidebar and mobile drawer navigation

---

## 🔑 Demo Credentials

Aplikasi ini punya 3 role dengan credential masing-masing:

| Role | Username | Password | Akses |
|------|----------|----------|-------|
| 🔴 **Admin** | `admin` | `admin123` | Full access — kelola employee, leave, reports, activity logs |
| 🟡 **Manager** | `manager` | `manager123` | Kelola & approve/reject leave requests |
| 🟢 **Employee** | `employee` | `employee123` | Submit & track leave requests sendiri |

> **Note:** Password di-hash menggunakan **PBKDF2** (100,000 iterations, SHA-256) via Web Crypto API. Users di-seed ke localStorage saat pertama kali aplikasi dibuka.

---

## ✨ Features

### 🔐 Authentication & Authorization
- Login dengan validasi Zod + react-hook-form
- Session management (24 jam expiry) via localStorage + cookie
- Middleware-level route protection dengan RBAC
- Activity logging untuk setiap login/logout event

### 👥 Employee Management (Admin Only)
- CRUD operations untuk data karyawan
- Search & filter karyawan
- Server-side pagination (10 per halaman)
- Auto leave balance tracking (default: 12 hari/tahun)

### 📝 Leave Request Workflow
- Submit leave request dengan date picker & validasi
- Status lifecycle: `PENDING` → `APPROVED` / `REJECTED` / `CANCELLED`
- Leave balance auto-deduction saat approval
- Leave balance auto-restore saat delete approved leave (dengan Prisma `$transaction`)
- Filter berdasarkan status
- Status timeline visualization

### 📊 Dashboard
- Role-aware greeting & stats cards
- Interactive leave charts (Recharts)
- Recent activity feed
- Leave balance summary

### 📈 Reports & Analytics (Admin Only)
- Monthly trend analysis
- Per-employee leave analytics
- Per-department breakdown
- **Export ke CSV & PDF**

### 📋 Activity Logs (Admin Only)
- Immutable audit trail
- Kategori: AUTH, EMPLOYEE, LEAVE
- Filter & pagination
- Tracking user, action, target, IP address

### 🎨 UI/UX Premium
- **Glassmorphism** design dengan gradient mesh backgrounds
- **Dark/Light mode** toggle (OKLCH color system)
- **Responsive** — collapsible sidebar (desktop) + sheet drawer (mobile)
- **Toast notifications** (Sonner) untuk semua user feedback
- **shadcn/ui** components (17 komponen)
- Micro-animations & smooth transitions

### 📄 Production Audit Report
- Public page (`/report`) dengan code quality assessment
- Animated score display (78/100)
- 10 kategori assessment
- Vercel readiness checklist

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.2.9 (App Router) |
| **UI Library** | React 19.2.4 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 + tw-animate-css |
| **UI Components** | shadcn/ui v4.11.0 |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 7.8 + @prisma/adapter-pg |
| **Charts** | Recharts 3.8.1 |
| **Forms** | react-hook-form + @hookform/resolvers |
| **Validation** | Zod |
| **Icons** | Lucide React |
| **Themes** | next-themes |
| **Date Handling** | date-fns + react-day-picker |
| **Notifications** | Sonner (toast) |

---

## 🏗 Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Next.js App     │────▶│  Supabase        │
│              │     │  (App Router)    │     │  PostgreSQL      │
│  localStorage│     │                  │     │                  │
│  (Auth/Users)│     │  Middleware      │     │  employees       │
│              │     │  (proxy.ts)      │     │  leave_requests  │
│  Cookie      │     │  ↕ RBAC Check    │     │  activity_logs   │
│  (Session)   │     │                  │     │                  │
└──────────────┘     │  API Routes      │────▶│                  │
                     │  /api/*          │     │                  │
                     └──────────────────┘     └──────────────────┘
```

**Dual Auth System:**
1. **Client-side** — localStorage untuk user data & session + cookie (base64 JSON) untuk middleware
2. **Server-side** — Prisma + PostgreSQL untuk employee & leave data via API routes

---

## 🔒 Role-Based Access Control

### Route Permissions

| Route | Admin | Manager | Employee |
|-------|:-----:|:-------:|:--------:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/employees` | ✅ | ❌ | ❌ |
| `/employees/new` | ✅ | ❌ | ❌ |
| `/employees/edit/[id]` | ✅ | ❌ | ❌ |
| `/leave` | ✅ | ✅ | ❌ |
| `/leave/new` | ✅ | ✅ | ❌ |
| `/my-leave` | ❌ | ❌ | ✅ |
| `/my-leave/new` | ❌ | ❌ | ✅ |
| `/profile` | ❌ | ❌ | ✅ |
| `/reports` | ✅ | ❌ | ❌ |
| `/activity` | ✅ | ❌ | ❌ |

### Public Routes (No Auth)
- `/login` — Login page
- `/report` — Production audit report

---

## 🗺 Pages & Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Redirect ke `/dashboard` (authenticated) atau `/login` |
| `/login` | Login page dengan glassmorphism UI |
| `/report` | Public audit report page |

### Protected
| Route | Role | Description |
|-------|------|-------------|
| `/dashboard` | All | Dashboard dengan stats, charts, recent activity |
| `/employees` | Admin | Daftar karyawan dengan search & pagination |
| `/employees/new` | Admin | Form tambah karyawan baru |
| `/employees/edit/[id]` | Admin | Form edit data karyawan |
| `/leave` | Admin, Manager | Semua leave requests + approve/reject |
| `/leave/new` | Admin, Manager | Submit leave request |
| `/leave/edit/[id]` | Admin, Manager | Edit leave request |
| `/my-leave` | Employee | Leave requests milik sendiri |
| `/my-leave/new` | Employee | Submit leave request sendiri |
| `/profile` | Employee | Profile karyawan |
| `/reports` | Admin | Analytics & reports (CSV/PDF export) |
| `/activity` | Admin | Activity logs |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/employees` | List employees (paginated, searchable) |
| `POST` | `/api/employees` | Create employee |
| `GET` | `/api/employees/[id]` | Get employee by ID |
| `PUT` | `/api/employees/[id]` | Update employee |
| `DELETE` | `/api/employees/[id]` | Delete employee |
| `GET` | `/api/leave` | List leave requests (filter by status/employeeId) |
| `POST` | `/api/leave` | Create leave request |
| `GET` | `/api/leave/[id]` | Get leave request by ID |
| `PATCH` | `/api/leave/[id]` | Update leave request status |
| `DELETE` | `/api/leave/[id]` | Delete leave request |
| `GET` | `/api/reports` | Reports data (monthly/employee/department) |
| `GET` | `/api/activity` | Activity logs (paginated) |
| `POST` | `/api/activity/auth` | Log auth events |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |

---

## 🗄 Database Schema

### Prisma Models

```
┌─────────────────┐       ┌──────────────────┐
│    Employee      │       │   LeaveRequest   │
├─────────────────┤       ├──────────────────┤
│ id          UUID │──┐   │ id          UUID  │
│ name     VARCHAR │  │   │ employeeId  UUID  │
│ department      │  └──▶│ startDate VARCHAR │
│ position        │       │ endDate   VARCHAR │
│ leaveBalance INT│       │ reason    VARCHAR │
│ createdAt       │       │ status      ENUM  │
│ updatedAt       │       │ createdAt         │
└─────────────────┘       │ updatedAt         │
                          └──────────────────┘

┌─────────────────┐
│  ActivityLog     │
├─────────────────┤
│ id          UUID │
│ action    VARCHAR│
│ category  VARCHAR│
│ description     │
│ userId          │
│ userName        │
│ targetId        │
│ targetName      │
│ metadata   TEXT  │
│ ipAddress       │
│ createdAt       │
└─────────────────┘
```

**Leave Status Enum:** `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED`

---

## 📁 Project Structure

```
employee-leave-system/
├── prisma/
│   ├── schema.prisma        # Prisma schema (3 models)
│   ├── schema.sql           # Full SQL schema (extended)
│   └── seed.ts              # Database seeder (5 employees, 6 leave requests)
├── src/
│   ├── app/
│   │   ├── (protected)/     # Auth-required routes
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── leave/
│   │   │   ├── my-leave/
│   │   │   ├── profile/
│   │   │   ├── reports/
│   │   │   ├── activity/
│   │   │   └── layout.tsx   # Protected layout (AuthGuard + Sidebar)
│   │   ├── api/             # API routes
│   │   │   ├── employees/
│   │   │   ├── leave/
│   │   │   ├── reports/
│   │   │   ├── activity/
│   │   │   └── dashboard/
│   │   ├── login/           # Login page
│   │   ├── report/          # Public audit report
│   │   ├── globals.css      # Global styles + Tailwind
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Root redirect
│   ├── components/
│   │   ├── dashboard/       # Stats cards, charts, activity feed (5 files)
│   │   ├── employee/        # Employee form, search, table (3 files)
│   │   ├── leave/           # Leave form, table, calendar, filter (6 files)
│   │   ├── shared/          # Auth guard, navbar, pagination, etc. (9 files)
│   │   └── ui/              # shadcn/ui components (17 files)
│   ├── constants/           # Roles, route permissions, cookie config
│   ├── hooks/               # useAuth, useEmployees, useLeaveRequests
│   ├── lib/                 # Utilities (auth, session, prisma, logger, export)
│   ├── services/            # API clients & storage (auth, user, employee, leave)
│   ├── types/               # TypeScript type definitions
│   ├── validators/          # Zod validation schemas
│   └── proxy.ts             # Next.js middleware (RBAC)
├── .env                     # Environment variables
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**
- **PostgreSQL** database (or Supabase account)

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd employee-leave-system

# 2. Install dependencies
npm install

# 3. Setup environment variables
# Edit .env with your database credentials:
#   DATABASE_URL="postgresql://..."    (pooler, port 6543)
#   DIRECT_URL="postgresql://..."      (direct, port 5432)

# 4. Generate Prisma client
npx prisma generate

# 5. Push database schema
npm run db:push

# 6. Seed the database
npm run db:seed

# 7. Start development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dan login dengan salah satu credential di atas.

---

## 📜 Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `next dev` | Start development server |
| `npm run build` | `prisma generate && next build` | Build for production |
| `npm run start` | `next start` | Start production server |
| `npm run lint` | `eslint` | Run linter |
| `npm run db:push` | `prisma db push` | Push schema to database |
| `npm run db:seed` | `npx tsx prisma/seed.ts` | Seed database |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio |

---

## ⚠️ Known Limitations

- API routes belum punya server-side authentication (publicly accessible)
- Auth cookie menggunakan base64-encoded JSON (belum cryptographically signed)
- Cookie di-set client-side (tidak bisa HttpOnly)
- Potential race conditions pada concurrent leave approvals
- Unbounded queries di reports API

---

<p align="center">
  Built with ❤️ using Next.js, React, and TypeScript
</p>
