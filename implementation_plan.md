# Employee Leave Management System — Implementation Plan

Berdasarkan spesifikasi di [Mini_Project_Specification_Employee_Leave_System.md](file:///C:/Users/901570/Documents/vibecoding/file/Mini_Project_Specification_Employee_Leave_System.md), berikut adalah breakdown implementasi secara komprehensif.

## Ringkasan Proyek

Membangun aplikasi web monolitik menggunakan **Next.js App Router** untuk mengelola data karyawan dan pengajuan cuti. Seluruh data disimpan di **Local Storage** (tanpa backend/database). Aplikasi harus responsif, mendukung CRUD karyawan, CRUD pengajuan cuti, dan workflow approve/reject.

---

## Technology Stack

| Teknologi | Kegunaan |
|---|---|
| Next.js (App Router) | Framework utama + routing |
| TypeScript | Type safety |
| Tailwind CSS | Styling utility-first |
| ShadCN UI | Komponen UI (Button, Input, Dialog, Table, dll.) |
| React Hook Form | Manajemen form state |
| Zod | Schema validation |
| Local Storage | Penyimpanan data persisten di browser |

---

## Proposed Changes

### 1. Project Initialization & Configuration

#### [NEW] Project root (`C:\Users\901570\Documents\vibecoding\employee-leave-system`)

Langkah-langkah:

1. **Inisialisasi Next.js project** menggunakan `npx create-next-app@latest` dengan opsi:
   - TypeScript ✅
   - Tailwind CSS ✅
   - ESLint ✅
   - App Router ✅
   - `src/` directory ✅

2. **Inisialisasi ShadCN UI** menggunakan `npx shadcn@latest init` dengan konfigurasi:
   - Style: Default/New York
   - Base color: Slate (atau sesuai preferensi)
   - CSS variables: Yes

3. **Install dependencies tambahan**:
   - `react-hook-form` — form state management
   - `@hookform/resolvers` — integrasi Zod dengan React Hook Form
   - `zod` — schema validation
   - `uuid` — generate unique ID untuk entity
   - `date-fns` — utilitas manipulasi tanggal
   - `lucide-react` — ikon (sudah include di ShadCN)

4. **Install ShadCN UI components** yang dibutuhkan:
   - `button`, `input`, `label`, `card`, `table`, `select`, `dialog`, `badge`, `toast`, `dropdown-menu`, `form`, `calendar`, `popover`, `separator`, `sheet`, `avatar`, `sidebar`

---

### 2. Type Definitions

#### [NEW] `src/types/employee.ts`

```typescript
export type Employee = {
  id: string;          // UUID, auto-generated
  name: string;        // min 3 karakter
  department: string;  // required
  position: string;    // required
  createdAt: string;   // ISO date string
  updatedAt: string;   // ISO date string
};
```

#### [NEW] `src/types/leave-request.ts`

```typescript
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveRequest = {
  id: string;           // UUID, auto-generated
  employeeId: string;   // referensi ke Employee.id
  startDate: string;    // ISO date string (YYYY-MM-DD)
  endDate: string;      // ISO date string (YYYY-MM-DD)
  reason: string;       // required
  status: LeaveStatus;  // default: "PENDING"
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
};
```

#### [NEW] `src/types/auth.ts`

```typescript
export type AuthSession = {
  username: string;
  isAuthenticated: boolean;
  loginAt: string; // ISO date string
};
```

#### [NEW] `src/types/index.ts`

Re-export semua types dari satu entry point.

---

### 3. Validation Schemas (Zod)

#### [NEW] `src/validators/employee-validator.ts`

| Field | Rule |
|---|---|
| `name` | Required, min 3 karakter, string trim |
| `department` | Required, min 1 karakter |
| `position` | Required, min 1 karakter |

```typescript
// Zod schema untuk create & edit employee
export const employeeSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter"),
  department: z.string().trim().min(1, "Department wajib diisi"),
  position: z.string().trim().min(1, "Position wajib diisi"),
});
```

#### [NEW] `src/validators/leave-validator.ts`

| Field | Rule |
|---|---|
| `employeeId` | Required, harus valid UUID |
| `startDate` | Required, format date valid |
| `endDate` | Required, harus > startDate |
| `reason` | Required, min 1 karakter |

```typescript
// Zod schema dengan custom refinement untuk date comparison
export const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, "Employee wajib dipilih"),
  startDate: z.string().min(1, "Start Date wajib diisi"),
  endDate: z.string().min(1, "End Date wajib diisi"),
  reason: z.string().trim().min(1, "Reason wajib diisi"),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: "End Date harus setelah Start Date", path: ["endDate"] }
);
```

#### [NEW] `src/validators/auth-validator.ts`

| Field | Rule |
|---|---|
| `username` | Required |
| `password` | Required |

---

### 4. Local Storage Services

#### [NEW] `src/services/employee-storage.ts`

Service layer untuk operasi CRUD Employee ke Local Storage.

| Method | Signature | Deskripsi |
|---|---|---|
| `getAll` | `() => Employee[]` | Ambil seluruh data employee |
| `getById` | `(id: string) => Employee \| undefined` | Ambil employee by ID |
| `create` | `(data: Omit<Employee, 'id' \| 'createdAt' \| 'updatedAt'>) => Employee` | Buat employee baru dengan auto-generate ID |
| `update` | `(id: string, data: Partial<Employee>) => Employee` | Update employee, set updatedAt |
| `delete` | `(id: string) => void` | Hapus employee by ID |
| `search` | `(query: string) => Employee[]` | Cari employee berdasarkan nama (case-insensitive) |
| `count` | `() => number` | Hitung total employee |

Detail implementasi:
- Local Storage key: `"employees"`
- Data disimpan sebagai JSON array
- Setiap operasi tulis harus memanggil `localStorage.setItem()`
- Gunakan `uuid` untuk generate ID
- Handle edge case: localStorage kosong → return array kosong

#### [NEW] `src/services/leave-storage.ts`

Service layer untuk operasi CRUD LeaveRequest ke Local Storage.

| Method | Signature | Deskripsi |
|---|---|---|
| `getAll` | `() => LeaveRequest[]` | Ambil seluruh leave request |
| `getById` | `(id: string) => LeaveRequest \| undefined` | Ambil leave request by ID |
| `create` | `(data: Omit<LeaveRequest, 'id' \| 'status' \| 'createdAt' \| 'updatedAt'>) => LeaveRequest` | Buat request baru, status default PENDING |
| `updateStatus` | `(id: string, status: LeaveStatus) => LeaveRequest` | Approve/Reject request |
| `delete` | `(id: string) => void` | Hapus leave request |
| `getByStatus` | `(status: LeaveStatus) => LeaveRequest[]` | Filter by status |
| `getByEmployeeId` | `(employeeId: string) => LeaveRequest[]` | Filter by employee |
| `countByStatus` | `(status: LeaveStatus) => number` | Hitung jumlah per status |

Detail implementasi:
- Local Storage key: `"leaveRequests"`
- Status default untuk request baru: `"PENDING"`

#### [NEW] `src/services/auth-storage.ts`

Service layer untuk autentikasi.

| Method | Signature | Deskripsi |
|---|---|---|
| `login` | `(username: string, password: string) => boolean` | Validasi credentials & simpan session |
| `logout` | `() => void` | Hapus session dari localStorage |
| `getSession` | `() => AuthSession \| null` | Ambil session aktif |
| `isAuthenticated` | `() => boolean` | Cek apakah user sudah login |

Detail implementasi:
- Hardcoded credentials: `admin` / `admin123`
- Local Storage key: `"authSession"`
- Session berisi: `{ username, isAuthenticated: true, loginAt }`

---

### 5. Custom Hooks

#### [NEW] `src/hooks/use-auth.ts`

Hook untuk autentikasi — wraps auth-storage service, menyediakan:
- `login(username, password)` → return `boolean`
- `logout()` → redirect ke `/login`
- `session` → current session state
- `isAuthenticated` → boolean

#### [NEW] `src/hooks/use-employees.ts`

Hook untuk manajemen data employee — wraps employee-storage:
- `employees` — list semua employee
- `addEmployee(data)` — create baru
- `updateEmployee(id, data)` — update
- `deleteEmployee(id)` — hapus
- `searchEmployees(query)` — search by name
- `getEmployee(id)` — get by ID
- Trigger re-render setelah mutasi

#### [NEW] `src/hooks/use-leave-requests.ts`

Hook untuk manajemen leave request — wraps leave-storage:
- `leaveRequests` — list semua request
- `addLeaveRequest(data)` — create baru
- `approveRequest(id)` — set status APPROVED
- `rejectRequest(id)` — set status REJECTED
- `filterByStatus(status)` — filter
- Trigger re-render setelah mutasi

#### [NEW] `src/hooks/use-local-storage.ts`

Generic hook untuk localStorage reactivity:
- Subscribe ke `storage` event untuk cross-tab sync
- Trigger re-render ketika data berubah

---

### 6. Shared / Layout Components

#### [NEW] `src/components/shared/navbar.tsx`

Komponen navigasi utama dengan menu items:

| Menu | Link | Icon |
|---|---|---|
| Dashboard | `/dashboard` | LayoutDashboard |
| Employees | `/employees` | Users |
| Leave Requests | `/leave` | CalendarDays |
| Logout | (action) | LogOut |

Fitur:
- Responsive — hamburger menu di mobile, sidebar/topbar di desktop
- Active state indicator pada menu aktif
- Tombol logout memanggil `auth.logout()`
- Menggunakan ShadCN `Sheet` atau `Sidebar` untuk mobile

#### [NEW] `src/components/shared/page-header.tsx`

Komponen header halaman dengan title, subtitle, dan action button opsional.

#### [NEW] `src/components/shared/confirm-dialog.tsx`

Dialog konfirmasi untuk aksi destructive (hapus employee, dll.) menggunakan ShadCN `AlertDialog`.

#### [NEW] `src/components/shared/empty-state.tsx`

Komponen untuk menampilkan state kosong (no data) dengan ikon dan pesan.

#### [NEW] `src/components/shared/status-badge.tsx`

Badge untuk status leave request dengan warna berbeda:
- PENDING → kuning/amber
- APPROVED → hijau
- REJECTED → merah

---

### 7. Authentication Module

#### [NEW] `src/app/login/page.tsx`

**Route**: `/login`

| Elemen | Detail |
|---|---|
| Form fields | Username (text input), Password (password input) |
| Validation | Zod schema via React Hook Form |
| Submit handler | Panggil `authService.login()` |
| Success | Redirect ke `/dashboard` via `router.push()` |
| Error | Tampilkan toast/alert "Invalid credentials" |
| Session | Simpan di localStorage |

Desain:
- Centered login card dengan glassmorphism
- Logo/title di atas form
- Loading state pada tombol saat submit

#### [MODIFY] `src/app/layout.tsx`

- Tambahkan auth guard / middleware check
- Wrap dengan providers (toast, theme)

#### [NEW] `src/middleware.ts`

Next.js middleware untuk proteksi route:
- Cek session di cookie/localStorage
- Redirect ke `/login` jika belum authenticated
- Allow akses ke `/login` tanpa auth

> [!NOTE]
> Karena menggunakan Local Storage (client-side only), middleware Next.js tidak bisa langsung membaca localStorage. Alternatif: gunakan client-side auth guard component yang membungkus protected pages.

#### [NEW] `src/components/shared/auth-guard.tsx`

Client component yang:
- Cek `localStorage` untuk session
- Jika tidak authenticated → redirect ke `/login`
- Jika authenticated → render children
- Tampilkan loading skeleton saat checking

---

### 8. Dashboard Module

#### [NEW] `src/app/dashboard/page.tsx`

**Route**: `/dashboard`

Menampilkan 4 kartu statistik:

| Card | Data Source | Icon | Warna |
|---|---|---|---|
| Total Employees | `employeeStorage.count()` | Users | Biru |
| Pending Leave | `leaveStorage.countByStatus("PENDING")` | Clock | Kuning/Amber |
| Approved Leave | `leaveStorage.countByStatus("APPROVED")` | CheckCircle | Hijau |
| Rejected Leave | `leaveStorage.countByStatus("REJECTED")` | XCircle | Merah |

#### [NEW] `src/components/dashboard/stats-card.tsx`

Komponen card individual:
- Props: `title`, `value`, `icon`, `color/variant`
- Desain: ShadCN `Card` dengan ikon besar, angka besar, dan title di bawah
- Animasi: count-up animation saat page load (opsional)
- Hover effect: slight scale/shadow

#### [NEW] `src/components/dashboard/dashboard-grid.tsx`

Grid layout untuk 4 stats card:
- 1 kolom di mobile
- 2 kolom di tablet
- 4 kolom di desktop
- Menggunakan CSS Grid / Tailwind grid

---

### 9. Employee Management Module

#### [NEW] `src/app/employees/page.tsx`

**Route**: `/employees`

Layout:
- Page header: "Employees" + tombol "Add Employee" (link ke `/employees/new`)
- Search bar: input teks untuk filter by name
- Tabel daftar employee

#### [NEW] `src/components/employee/employee-table.tsx`

Tabel menggunakan ShadCN `Table`:

| Kolom | Deskripsi |
|---|---|
| Name | Nama employee |
| Department | Department |
| Position | Position |
| Actions | Tombol Edit + Delete |

Fitur:
- Search/filter by name (client-side filtering)
- Tombol Edit → navigate ke `/employees/edit/[id]`
- Tombol Delete → confirm dialog → hapus dari localStorage
- Empty state jika tidak ada data
- Empty state jika search tidak menemukan hasil

#### [NEW] `src/components/employee/employee-search.tsx`

Komponen search input:
- Debounced search (300ms) agar tidak re-render setiap keystroke
- Clear button
- Search icon

#### [NEW] `src/app/employees/new/page.tsx`

**Route**: `/employees/new`

- Page header: "Add New Employee"
- Employee form component
- Setelah submit → redirect ke `/employees`

#### [NEW] `src/components/employee/employee-form.tsx`

Form reusable untuk Create & Edit employee:

| Field | Type | Validation |
|---|---|---|
| Name | Text input | Required, min 3 chars |
| Department | Text input atau Select | Required |
| Position | Text input | Required |

Props:
- `defaultValues?` — untuk pre-fill saat edit mode
- `onSubmit(data)` — callback handler
- `isEditing?` — boolean untuk mengubah label tombol

Integrasi:
- `react-hook-form` dengan `zodResolver`
- Tampilkan error messages inline per field
- Loading/disabled state pada submit button
- Toast notification setelah berhasil create/update

#### [NEW] `src/app/employees/edit/[id]/page.tsx`

**Route**: `/employees/edit/[id]`

- Load employee data by ID dari localStorage
- Jika ID tidak ditemukan → redirect ke `/employees` atau tampilkan 404
- Render `EmployeeForm` dengan `defaultValues` dari data existing
- Setelah submit → update localStorage → redirect ke `/employees`

---

### 10. Leave Request Module

#### [NEW] `src/app/leave/page.tsx`

**Route**: `/leave`

Layout:
- Page header: "Leave Requests" + tombol "New Request" (link ke `/leave/new`)
- Filter dropdown/tabs: All | Pending | Approved | Rejected
- Tabel daftar leave request

#### [NEW] `src/components/leave/leave-table.tsx`

Tabel menggunakan ShadCN `Table`:

| Kolom | Deskripsi |
|---|---|
| Employee Name | Lookup dari employee data by `employeeId` |
| Start Date | Format: DD MMM YYYY |
| End Date | Format: DD MMM YYYY |
| Duration | Kalkulasi hari (endDate - startDate) |
| Reason | Teks alasan |
| Status | Badge (PENDING/APPROVED/REJECTED) |
| Actions | Approve/Reject buttons (hanya untuk PENDING) |

Fitur:
- Filter by status (tabs atau dropdown)
- Approve button → confirm → update status ke APPROVED
- Reject button → confirm → update status ke REJECTED
- Tombol aksi hanya muncul jika status = PENDING
- Toast notification setelah approve/reject
- Empty state jika tidak ada data

#### [NEW] `src/components/leave/leave-filter.tsx`

Komponen filter status:
- Tabs atau segmented control: All | Pending | Approved | Rejected
- Count badge pada setiap tab
- Active state styling

#### [NEW] `src/app/leave/new/page.tsx`

**Route**: `/leave/new`

- Page header: "New Leave Request"
- Leave request form component
- Setelah submit → redirect ke `/leave`

#### [NEW] `src/components/leave/leave-form.tsx`

Form untuk membuat leave request baru:

| Field | Type | Validation |
|---|---|---|
| Employee | Select/Combobox | Required, pilih dari daftar employee |
| Start Date | Date picker | Required |
| End Date | Date picker | Required, harus > Start Date |
| Reason | Textarea | Required |

Integrasi:
- `react-hook-form` dengan `zodResolver`
- Employee dropdown diambil dari `employeeStorage.getAll()`
- Date picker menggunakan ShadCN `Calendar` + `Popover`
- Validasi cross-field: endDate > startDate
- Toast notification setelah berhasil create
- Jika belum ada employee → tampilkan pesan "Tambahkan employee terlebih dahulu"

---

### 11. Root & App Configuration

#### [MODIFY] `src/app/page.tsx`

Redirect dari `/` ke `/login` atau `/dashboard` tergantung auth state.

#### [MODIFY] `src/app/layout.tsx`

- Import global CSS + fonts (Inter dari Google Fonts)
- Setup `<html>` dan `<body>` tags
- Metadata: title "Employee Leave Management System"
- Toast provider (ShadCN Toaster)

#### [NEW] `src/app/(protected)/layout.tsx`

Route group layout untuk halaman yang butuh auth:
- Wrap dengan `AuthGuard`
- Include `Navbar` / sidebar
- Consistent padding/margin

> [!IMPORTANT]
> Gunakan **Next.js Route Groups** `(protected)` untuk memisahkan layout antara halaman login (tanpa navbar) dan halaman authenticated (dengan navbar). Ini berarti route structure menjadi:
> ```
> src/app/
> ├── login/page.tsx            ← tanpa navbar
> ├── (protected)/
> │   ├── layout.tsx            ← dengan AuthGuard + Navbar
> │   ├── dashboard/page.tsx
> │   ├── employees/...
> │   └── leave/...
> ```

---

### 12. Utility / Library Functions

#### [NEW] `src/lib/utils.ts`

Utilitas umum (sebagian sudah di-generate ShadCN):
- `cn()` — class name merger (sudah ada dari ShadCN)
- `formatDate(date: string) => string` — format tanggal
- `generateId() => string` — wrapper uuid
- `calculateDuration(start: string, end: string) => number` — hitung selisih hari

---

## Folder Structure Final

```
src/
├── app/
│   ├── page.tsx                         # Root redirect
│   ├── layout.tsx                       # Root layout + providers
│   ├── globals.css                      # Tailwind + custom styles
│   │
│   ├── login/
│   │   └── page.tsx                     # Login page
│   │
│   └── (protected)/
│       ├── layout.tsx                   # Auth guard + Navbar layout
│       ├── dashboard/
│       │   └── page.tsx                 # Dashboard page
│       ├── employees/
│       │   ├── page.tsx                 # Employee list
│       │   ├── new/
│       │   │   └── page.tsx             # Create employee
│       │   └── edit/
│       │       └── [id]/
│       │           └── page.tsx         # Edit employee
│       └── leave/
│           ├── page.tsx                 # Leave request list
│           └── new/
│               └── page.tsx             # Create leave request
│
├── components/
│   ├── ui/                              # ShadCN UI components (auto-generated)
│   ├── shared/
│   │   ├── navbar.tsx                   # Navigation bar/sidebar
│   │   ├── auth-guard.tsx               # Auth protection wrapper
│   │   ├── page-header.tsx              # Reusable page header
│   │   ├── confirm-dialog.tsx           # Delete confirmation dialog
│   │   ├── empty-state.tsx              # Empty state component
│   │   └── status-badge.tsx             # Leave status badge
│   ├── dashboard/
│   │   ├── stats-card.tsx               # Individual stat card
│   │   └── dashboard-grid.tsx           # Stats grid layout
│   ├── employee/
│   │   ├── employee-table.tsx           # Employee data table
│   │   ├── employee-form.tsx            # Create/Edit form
│   │   └── employee-search.tsx          # Search input
│   └── leave/
│       ├── leave-table.tsx              # Leave request table
│       ├── leave-form.tsx               # Create leave form
│       └── leave-filter.tsx             # Status filter tabs
│
├── services/
│   ├── auth-storage.ts                  # Auth localStorage service
│   ├── employee-storage.ts              # Employee localStorage service
│   └── leave-storage.ts                 # Leave localStorage service
│
├── types/
│   ├── index.ts                         # Re-exports
│   ├── employee.ts                      # Employee type
│   ├── leave-request.ts                 # LeaveRequest type
│   └── auth.ts                          # Auth types
│
├── validators/
│   ├── auth-validator.ts                # Login form schema
│   ├── employee-validator.ts            # Employee form schema
│   └── leave-validator.ts               # Leave form schema
│
├── hooks/
│   ├── use-auth.ts                      # Auth hook
│   ├── use-employees.ts                 # Employee CRUD hook
│   ├── use-leave-requests.ts            # Leave CRUD hook
│   └── use-local-storage.ts             # Generic localStorage hook
│
└── lib/
    └── utils.ts                         # Utility functions
```

**Total files baru: ~35 files** (termasuk ShadCN UI components yang auto-generated)

---

## User Review Required

> [!IMPORTANT]
> **Tailwind CSS**: Spesifikasi meminta Tailwind CSS. Ini berbeda dari default guideline saya yang menggunakan Vanilla CSS. Saya akan mengikuti spesifikasi dan menggunakan **Tailwind CSS** sesuai requirement.

> [!IMPORTANT]
> **ShadCN UI Style**: ShadCN menawarkan 2 style — **Default** dan **New York**. Default lebih rounded dan colorful, New York lebih sharp dan minimal. Rekomendasi: **New York** untuk tampilan lebih profesional.

> [!IMPORTANT]
> **Route Group `(protected)`**: Saya merekomendasikan penggunaan route group Next.js untuk memisahkan layout login (tanpa sidebar) dari halaman authenticated (dengan sidebar). Ini tidak disebutkan di spesifikasi, tapi merupakan best practice.

## Open Questions

> [!IMPORTANT]
> 1. **Apakah perlu fitur delete pada Leave Request?** Spesifikasi hanya menyebutkan approve/reject, tapi tidak menyebutkan delete leave request. Apakah ingin ditambahkan?

> [!NOTE]
> 2. **Department list**: Apakah department menggunakan free-text input atau dropdown dengan daftar tetap? Jika dropdown, apa saja departemen yang tersedia?

> [!NOTE]
> 3. **Base color theme**: Preferensi warna dasar untuk ShadCN UI? Opsi: Slate, Gray, Zinc, Neutral, Stone. Rekomendasi: **Slate** (modern & profesional).

> [!NOTE]
> 4. **Seed data**: Apakah perlu data sample/dummy saat pertama kali membuka aplikasi (agar dashboard tidak kosong)?

---

## Execution Order

Implementasi akan dilakukan dalam urutan berikut, sesuai dependency:

| Phase | Komponen | Estimasi |
|---|---|---|
| **1** | Project init, dependencies, ShadCN setup | Setup awal |
| **2** | Types + Validators + Utility functions | Fondasi data |
| **3** | LocalStorage Services (auth, employee, leave) | Data layer |
| **4** | Custom Hooks | Bridge antara service & UI |
| **5** | Shared Components (navbar, auth-guard, dll.) | Komponen bersama |
| **6** | Root layout + Route group `(protected)` | App structure |
| **7** | Login Page | Authentication |
| **8** | Dashboard Page + Stats Components | Dashboard |
| **9** | Employee Module (list, create, edit, delete) | CRUD Employee |
| **10** | Leave Module (list, create, approve, reject) | CRUD Leave |
| **11** | Polish: responsive, edge cases, toast, UX | Finalisasi |

---

## Verification Plan

### Automated Tests

```bash
npm run build    # Pastikan tidak ada TypeScript/build errors
npm run lint     # Pastikan tidak ada linting issues
```

### Manual Verification

| Test Case | Expected Result |
|---|---|
| Buka `/` | Redirect ke `/login` |
| Login dengan `admin`/`admin123` | Redirect ke `/dashboard` |
| Login dengan credentials salah | Error message muncul |
| Buka `/dashboard` tanpa login | Redirect ke `/login` |
| Dashboard menampilkan 4 kartu | Angka sesuai data di localStorage |
| Tambah employee | Data tersimpan, muncul di tabel |
| Edit employee | Data terupdate |
| Delete employee | Data terhapus, confirm dialog muncul |
| Search employee by name | Tabel terfilter sesuai query |
| Buat leave request | Status default PENDING |
| Approve leave request | Status berubah ke APPROVED |
| Reject leave request | Status berubah ke REJECTED |
| Filter leave by status | Tabel terfilter sesuai status |
| End Date < Start Date | Validasi error muncul |
| Semua form kosong di-submit | Validasi error muncul di semua field |
| Responsive di mobile | Layout menyesuaikan, navbar jadi hamburger |
| Logout | Session dihapus, redirect ke `/login` |
| `npm run dev` berhasil | Aplikasi berjalan tanpa error |
